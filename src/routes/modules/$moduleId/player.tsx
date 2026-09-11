import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckCircle2, Lock, SearchX, X } from "lucide-react";

import { completeActivity, getModule, getModuleProgress } from "@/data/repositories";
import { activityMeta } from "@/lib/format";
import { EmptyState } from "@/components/lessons/empty-state";
import { RequiredBadge } from "@/components/lessons/badges";
import { VideoActivity } from "@/components/lessons/activities/video-activity";
import { DeckActivity } from "@/components/lessons/activities/deck-activity";
import { WeblinkActivity } from "@/components/lessons/activities/weblink-activity";
import { QuizActivity } from "@/components/lessons/activities/quiz-activity";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/modules/$moduleId/player")({
  validateSearch: (search: Record<string, unknown>) => ({
    step: Number(search['step'] ?? 0) || 0,
  }),
  head: () => ({
    meta: [
      { title: "Course player — Lessons" },
      { name: "description", content: "Work through this module's activities in order." },
      { property: "og:title", content: "Course player — Lessons" },
      {
        property: "og:description",
        content: "Work through this module's activities in order.",
      },
    ],
  }),
  component: PlayerPage,
});

function PlayerPage() {
  const { moduleId } = Route.useParams();
  const { step } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();

  const { data: module, isPending } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: () => getModule(moduleId),
  });
  const { data: progress } = useQuery({
    queryKey: ["module-progress", moduleId],
    queryFn: () => getModuleProgress(moduleId),
  });

  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (!justCompleted) return;
    const id = window.setTimeout(() => setJustCompleted(false), 900);
    return () => window.clearTimeout(id);
  }, [justCompleted]);

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!module || module.activities.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <EmptyState
          icon={SearchX}
          title="Nothing to play"
          description="This module has no activities yet. Check back once your trainer publishes them."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/">Back to home</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const activities = module.activities;
  const index = Math.min(Math.max(0, step), activities.length - 1);
  const activity = activities[index]!;
  const doneIds = progress?.completedActivityIds ?? [];
  const pct = progress?.progressPct ?? module.progressPct;

  async function handleComplete() {
    await completeActivity(module!.id, activity.id);
    await queryClient.invalidateQueries({ queryKey: ["module-progress", module!.id] });
    await queryClient.invalidateQueries({ queryKey: ["progress-summary"] });
    setJustCompleted(true);
    if (index < activities.length - 1) {
      void navigate({ to: ".", search: { step: index + 1 } });
    }
  }

  function goTo(target: number) {
    if (module!.orderLocked && target > index && !doneIds.includes(activity.id)) return;
    void navigate({ to: ".", search: { step: target } });
  }

  const allDone = doneIds.length >= activities.length;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label text-muted-foreground">Module</p>
          <h1 className="text-card-title truncate">{module.title}</h1>
        </div>
        <Button asChild variant="ghost" size="icon" aria-label="Exit player">
          <Link to="/modules/$moduleId" params={{ moduleId: module.id }}>
            <X className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Progress value={pct} className="h-1.5 flex-1" />
        <span className="tnum text-xs text-muted-foreground">{pct}%</span>
        {justCompleted && (
          <CheckCircle2 className="animate-check-pop size-4 text-status-complete" strokeWidth={2} />
        )}
      </div>

      {/* Stepper */}
      <ol className="mt-5 flex flex-wrap gap-2">
        {activities.map((a, i) => {
          const complete = doneIds.includes(a.id);
          const locked = module.orderLocked && i > index && !complete;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => goTo(i)}
                disabled={locked}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  i === index
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40",
                  locked && "cursor-not-allowed opacity-50",
                )}
              >
                {complete ? (
                  <CheckCircle2 className="size-3 text-status-complete" strokeWidth={2} />
                ) : locked ? (
                  <Lock className="size-3" strokeWidth={1.75} />
                ) : (
                  <span className="tnum">{i + 1}</span>
                )}
                <span className="max-w-32 truncate">{a.name}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <section key={activity.id} className="animate-step-in mt-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-card-title">{activity.name}</h2>
          {activity.required && <RequiredBadge />}
          <span className="tnum text-xs text-muted-foreground">{activityMeta(activity)}</span>
        </div>

        {activity.type === "video" && (
          <VideoActivity
            activity={activity}
            onComplete={handleComplete}
            done={doneIds.includes(activity.id)}
          />
        )}
        {activity.type === "deck" && (
          <DeckActivity
            activity={activity}
            onComplete={handleComplete}
            done={doneIds.includes(activity.id)}
          />
        )}
        {activity.type === "weblink" && (
          <WeblinkActivity
            activity={activity}
            onComplete={handleComplete}
            done={doneIds.includes(activity.id)}
          />
        )}
        {activity.type === "quiz" && (
          <QuizActivity activity={activity} onComplete={handleComplete} />
        )}
      </section>

      {allDone && (
        <div className="surface animate-soft-in mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm">
            <CheckCircle2 className="mr-1.5 inline size-4 text-status-complete" strokeWidth={2} />
            Module complete — nice work.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link to="/certificates">View certificates</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
