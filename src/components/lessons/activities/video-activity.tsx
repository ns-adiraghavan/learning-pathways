import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pause, PauseCircle, Play } from "lucide-react";

import type { BuilderQuestion, VideoActivity as VideoActivityType, VideoCheckpoint } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatClock } from "@/lib/format";
import {
  gdriveId,
  gdrivePreviewUrl,
  resolveProvider,
  youtubeEmbedUrl,
  youtubeId,
} from "@/lib/video-source";
import { cn } from "@/lib/utils";

const IDLE_MS = 60_000;

export function VideoActivity({
  activity,
  onComplete,
  done,
}: {
  activity: VideoActivityType;
  onComplete: () => void;
  done: boolean;
}) {
  const provider = resolveProvider(activity.src, activity.provider);
  const checkpoints = useMemo(
    () =>
      [...(activity.checkpoints ?? [])].sort((a, b) => {
        // Timed checkpoints in order; "at end" (null) always last.
        if (a.atSeconds === null) return 1;
        if (b.atSeconds === null) return -1;
        return a.atSeconds - b.atSeconds;
      }),
    [activity.checkpoints],
  );

  if (provider === "youtube" || provider === "gdrive") {
    return (
      <EmbeddedVideo
        provider={provider}
        src={activity.src}
        checkpoints={checkpoints}
        onComplete={onComplete}
        done={done}
      />
    );
  }

  return (
    <DirectVideo activity={activity} checkpoints={checkpoints} onComplete={onComplete} done={done} />
  );
}

/* ----------------------- Direct upload (no-skip) ------------------------ */

function DirectVideo({
  activity,
  checkpoints,
  onComplete,
  done,
}: {
  activity: VideoActivityType;
  checkpoints: VideoCheckpoint[];
  onComplete: () => void;
  done: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const maxWatched = useRef(0);
  const [pct, setPct] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pausedAway, setPausedAway] = useState(false);
  const [watched, setWatched] = useState(done);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<VideoCheckpoint | null>(null);

  const timed = checkpoints.filter((c) => c.atSeconds !== null);
  const endCheckpoint = checkpoints.find((c) => c.atSeconds === null) ?? null;

  // Focus enforcement — pause if the learner switches away or goes idle.
  useEffect(() => {
    if (!activity.enforceFocus) return;
    const pause = () => {
      const el = ref.current;
      if (el && !el.paused) {
        el.pause();
        setPausedAway(true);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") pause();
    };
    let idle = window.setTimeout(pause, IDLE_MS);
    const resetIdle = () => {
      window.clearTimeout(idle);
      idle = window.setTimeout(pause, IDLE_MS);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", pause);
    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);
    return () => {
      window.clearTimeout(idle);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", pause);
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
    };
  }, [activity.enforceFocus]);

  const togglePlay = () => {
    const el = ref.current;
    if (!el || active) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const answerCheckpoint = (cp: VideoCheckpoint) => {
    setAnswered((prev) => new Set(prev).add(cp.id));
    setActive(null);
    if (cp.atSeconds === null) {
      setWatched(true);
    } else {
      void ref.current?.play();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border border-border bg-black">
        {/* No native controls → the learner cannot scrub, drag or fast-forward. */}
        <video
          ref={ref}
          src={activity.src}
          playsInline
          className="aspect-video w-full"
          onClick={togglePlay}
          onPlay={() => {
            setPlaying(true);
            setPausedAway(false);
          }}
          onPause={() => setPlaying(false)}
          onSeeking={(e) => {
            // Defence in depth: never allow jumping past the furthest point watched.
            const el = e.currentTarget;
            if (el.currentTime > maxWatched.current + 0.75) {
              el.currentTime = maxWatched.current;
            }
          }}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration) {
              setPct((el.currentTime / el.duration) * 100);
              setRemaining(el.duration - el.currentTime);
            }
            if (el.currentTime > maxWatched.current) maxWatched.current = el.currentTime;

            // Fire the next due timed checkpoint.
            if (!active) {
              const due = timed.find(
                (c) => c.atSeconds !== null && el.currentTime >= c.atSeconds && !answered.has(c.id),
              );
              if (due) {
                el.pause();
                setActive(due);
              }
            }
          }}
          onEnded={() => {
            if (endCheckpoint && !answered.has(endCheckpoint.id)) setActive(endCheckpoint);
            else setWatched(true);
          }}
        />

        {/* In-video question overlay */}
        {active && (
          <div className="animate-soft-in absolute inset-0 overflow-y-auto bg-black/85 p-4 sm:p-6">
            <CheckpointCard
              checkpoint={active}
              onAnswered={() => answerCheckpoint(active)}
            />
          </div>
        )}

        {/* Play / pause overlay button when not asking a question */}
        {!active && !playing && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/35"
            aria-label="Play"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-primary">
              <Play className="size-6" strokeWidth={2} />
            </span>
          </button>
        )}

        {pausedAway && !active && (
          <div className="animate-soft-in absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 px-6 text-center">
            <PauseCircle className="size-6 text-white" strokeWidth={1.5} />
            <p className="text-sm font-[510] text-white">Paused</p>
            <p className="text-xs text-white/70">Return to the video to continue.</p>
            <Button size="sm" className="mt-2" onClick={togglePlay}>
              Resume
            </Button>
          </div>
        )}
      </div>

      {/* Display-only progress — deliberately not clickable/seekable */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          onClick={togglePlay}
          disabled={Boolean(active)}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Progress value={pct} className="h-1.5 flex-1" />
        <span className="tnum text-xs text-muted-foreground">{formatClock(remaining)} left</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Skipping ahead is disabled — watch through to finish.
          {checkpoints.length > 0 && ` ${checkpoints.length} question${checkpoints.length === 1 ? "" : "s"} along the way.`}
        </p>
        <Button onClick={onComplete} disabled={!watched && !done}>
          {done ? "Continue" : "Mark complete"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------- YouTube / Google Drive ----------------------- */

function EmbeddedVideo({
  provider,
  src,
  checkpoints,
  onComplete,
  done,
}: {
  provider: "youtube" | "gdrive";
  src: string;
  checkpoints: VideoCheckpoint[];
  onComplete: () => void;
  done: boolean;
}) {
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [confirmedWatched, setConfirmedWatched] = useState(done);

  const embedUrl =
    provider === "youtube"
      ? (() => {
          const id = youtubeId(src);
          return id ? youtubeEmbedUrl(id) : null;
        })()
      : (() => {
          const id = gdriveId(src);
          return id ? gdrivePreviewUrl(id) : null;
        })();

  const allAnswered = checkpoints.every((c) => answered.has(c.id));
  const ready = confirmedWatched && allAnswered;

  if (!embedUrl) {
    return (
      <div className="surface p-6 text-sm text-muted-foreground">
        This {provider === "youtube" ? "YouTube" : "Google Drive"} link can’t be embedded. Ask your
        trainer to check the video source.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-black">
        <iframe
          src={embedUrl}
          title="Video"
          className="aspect-video w-full"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Checkpoint questions gate completion for embedded videos */}
      {checkpoints.length > 0 && (
        <div className="grid gap-3">
          {checkpoints.map((cp) => (
            <div key={cp.id} className="surface p-3 sm:p-4">
              <CheckpointCard
                checkpoint={cp}
                answered={answered.has(cp.id)}
                onAnswered={() => setAnswered((prev) => new Set(prev).add(cp.id))}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 rounded border-border"
            checked={confirmedWatched}
            onChange={(e) => setConfirmedWatched(e.target.checked)}
          />
          I’ve watched the full video
        </label>
        <Button onClick={onComplete} disabled={!ready && !done}>
          {done ? "Continue" : "Mark complete"}
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------- Question card ----------------------------- */

function CheckpointCard({
  checkpoint,
  answered = false,
  onAnswered,
}: {
  checkpoint: VideoCheckpoint;
  answered?: boolean;
  onAnswered: () => void;
}) {
  const q: BuilderQuestion = checkpoint.question;
  const kind = q.kind ?? "single";
  const isMulti = kind === "multi";
  const [picks, setPicks] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(answered);

  const correctSet = isMulti ? (q.correctIndices ?? []) : [q.correctIndex];
  const isCorrect =
    correctSet.length === picks.length && correctSet.every((c) => picks.includes(c));

  const toggle = (i: number) => {
    if (submitted) return;
    if (isMulti) setPicks((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
    else setPicks([i]);
  };

  return (
    <div className="mx-auto max-w-xl rounded-xl bg-card p-4 sm:p-5">
      <p className="text-xs font-[590] uppercase tracking-wide text-primary">
        Quick check{isMulti ? " · select all that apply" : ""}
      </p>
      <h3 className="mt-1 text-base font-[590]">{q.prompt || "Question"}</h3>
      <div className="mt-3 grid gap-2">
        {q.options.map((opt, i) => {
          const picked = picks.includes(i);
          const showCorrect = submitted && correctSet.includes(i);
          const showWrong = submitted && picked && !correctSet.includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={submitted}
              onClick={() => toggle(i)}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3.5 py-2.5 text-left text-sm transition-colors",
                showCorrect
                  ? "border-status-complete bg-status-complete/10"
                  : showWrong
                    ? "border-status-overdue bg-status-overdue/10"
                    : picked
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center border text-[11px] font-[590]",
                  isMulti ? "rounded-[5px]" : "rounded-full",
                  showCorrect
                    ? "border-status-complete bg-status-complete text-white"
                    : picked
                      ? "border-primary bg-primary text-white"
                      : "border-border text-muted-foreground",
                )}
              >
                {showCorrect || picked ? (
                  <Check className="size-3.5" strokeWidth={2.5} />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {submitted && q.explanation && (
        <p className="mt-3 rounded-md bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-[510] text-foreground">Why:</span> {q.explanation}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span
          className={cn(
            "text-xs",
            submitted
              ? isCorrect
                ? "text-status-complete"
                : "text-status-overdue"
              : "text-transparent",
          )}
        >
          {submitted ? (isCorrect ? "Correct" : "Not quite") : "."}
        </span>
        {!submitted ? (
          <Button size="sm" disabled={picks.length === 0} onClick={() => setSubmitted(true)}>
            Check
          </Button>
        ) : (
          <Button size="sm" onClick={onAnswered}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
