import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";

import { getAssignedModules } from "@/data/repositories";
import { formatDate } from "@/lib/format";
import { CategoryBadge, StatusDot } from "@/components/lessons/badges";
import { EmptyState } from "@/components/lessons/empty-state";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/my-learning")({
  head: () => ({
    meta: [
      { title: "My Learning — Lessons" },
      {
        name: "description",
        content: "Every module you've started, with progress, due dates and a quick way to resume.",
      },
      { property: "og:title", content: "My Learning — Lessons" },
      {
        property: "og:description",
        content: "Every module you've started, with progress, due dates and a quick way to resume.",
      },
    ],
  }),
  component: MyLearningPage,
});

function MyLearningPage() {
  const { data: modules, isPending } = useQuery({
    queryKey: ["modules"],
    queryFn: getAssignedModules,
  });

  const list = (modules ?? []).filter((m) => m.status !== "complete");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-title">My Learning</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick up where you left off.
        </p>
      </header>

      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing in progress"
          description="When a module is assigned to you it shows up here with its progress and due date."
        />
      ) : (
        <ul className="space-y-3">
          {list.map((m) => (
            <li key={m.id} className="surface card-hover p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <img
                  src={m.posterImage}
                  alt=""
                  loading="lazy"
                  width={1024}
                  height={576}
                  className="h-20 w-full shrink-0 rounded-md border border-border object-cover sm:w-32"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <CategoryBadge category={m.category} />
                    <StatusDot status={m.status} withLabel />
                  </div>
                  <Link
                    to="/modules/$moduleId"
                    params={{ moduleId: m.id }}
                    className="text-card-title hover:text-primary"
                  >
                    {m.title}
                  </Link>
                  <div className="mt-2.5 flex items-center gap-3">
                    <Progress value={m.progressPct} className="h-1.5 flex-1" />
                    <span className="tnum text-xs text-muted-foreground">{m.progressPct}%</span>
                  </div>
                  <p className="tnum mt-1.5 text-xs text-muted-foreground">
                    Due {formatDate(m.dueDate)}
                  </p>
                </div>
                <Button asChild size="sm" className="shrink-0">
                  <Link to="/modules/$moduleId/player" params={{ moduleId: m.id }} search={{ step: 0 }}>
                    Resume
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
