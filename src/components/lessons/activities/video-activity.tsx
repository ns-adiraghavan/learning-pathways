import { useEffect, useRef, useState } from "react";
import { PauseCircle } from "lucide-react";

import type { VideoActivity as VideoActivityType } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatClock } from "@/lib/format";

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
  const ref = useRef<HTMLVideoElement>(null);
  const [pct, setPct] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [watched, setWatched] = useState(done);

  useEffect(() => {
    if (!activity.enforceFocus) return;

    const pause = () => {
      const el = ref.current;
      if (el && !el.paused) {
        el.pause();
        setPaused(true);
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

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border border-border bg-black">
        <video
          ref={ref}
          src={activity.src}
          controls
          playsInline
          className="aspect-video w-full"
          onPlay={() => setPaused(false)}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration) {
              setPct((el.currentTime / el.duration) * 100);
              setRemaining(el.duration - el.currentTime);
            }
          }}
          onEnded={() => setWatched(true)}
        />
        {paused && (
          <div className="animate-soft-in absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 px-6 text-center">
            <PauseCircle className="size-6 text-white" strokeWidth={1.5} />
            <p className="text-sm font-[510] text-white">Paused</p>
            <p className="text-xs text-white/70">Return to the video to continue.</p>
            <Button
              size="sm"
              className="mt-2"
              onClick={() => {
                setPaused(false);
                void ref.current?.play();
              }}
            >
              Resume
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Progress value={pct} className="h-1.5 flex-1" />
        <span className="tnum text-xs text-muted-foreground">{formatClock(remaining)} left</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {activity.enforceFocus
            ? "Focus is enforced — the video pauses if you switch away."
            : "Watch to the end to mark this complete."}
        </p>
        <Button onClick={onComplete} disabled={!watched && !done}>
          {done ? "Continue" : "Mark complete"}
        </Button>
      </div>
    </div>
  );
}
