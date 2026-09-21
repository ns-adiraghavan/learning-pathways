import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";

import { getAssignedModules, getProgressSummary } from "@/data/repositories";
import { formatDate } from "@/lib/format";
import { CategoryBadge, CATEGORY_TINT, StatusDot } from "@/components/lessons/badges";
import { EmptyState } from "@/components/lessons/empty-state";
import { DoodlePanel } from "@/components/doodle-field";
import { StatTile } from "@/components/lessons/count-up";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageFade, ShimmerBlock, Stagger, StaggerItem } from "@/components/motion/motion";

const STATUS_VALUES = ["all", "in-progress", "completed", "overdue"] as const;
type StatusFilter = (typeof STATUS_VALUES)[number];

export const Route = createFileRoute("/my-learning")({
  validateSearch: (search: Record<string, unknown>): { status: StatusFilter } => {
    const raw = String(search["status"] ?? "all") as StatusFilter;
    return { status: STATUS_VALUES.includes(raw) ? raw : "all" };
  },
  head: () => ({
    meta: [
      { title: "My Learning — Lessons" },
      {
        name: "description",
        content:
          "Your learning snapshot and every module in flight, with progress, due dates and a quick way to resume.",
      },
      { property: "og:title", content: "My Learning — Lessons" },
      {
        property: "og:description",
        content:
          "Your learning snapshot and every module in flight, with progress, due dates and a quick way to resume.",
      },
    ],
  }),
  component: MyLearningPage,
});

const FILTER_LABEL: Record<StatusFilter, string> = {
  all: "In flight",
  "in-progress": "In progress",
  completed: "Completed",
  overdue: "Overdue",
};

function MyLearningPage() {
  const { status } = Route.useSearch();
  const { data: modules, isPending } = useQuery({
    queryKey: ["modules"],
    queryFn: getAssignedModules,
  });
  const { data: summary } = useQuery({
    queryKey: ["progress-summary"],
    queryFn: getProgressSummary,
  });

  const all = modules ?? [];
  const list =
    status === "completed"
      ? all.filter((m) => m.status === "complete")
      : status === "overdue"
        ? all.filter((m) => m.status === "overdue")
        : status === "in-progress"
          ? all.filter((m) => m.status === "in-progress")
          : all.filter((m) => m.status !== "complete");
  const total = summary?.totalModules ?? 0;
  const pct = total ? Math.round(((summary?.completedModules ?? 0) / total) * 100) : 0;

  return (
    <PageFade className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="surface blue-wash relative mb-6 overflow-hidden p-5">
        <DoodlePanel />
        <div className="relative">
          <p className="text-[11px] tracking-[0.14em] uppercase text-brand-blue">
            Your learning, at a glance
          </p>
          <h1 className="text-title mt-1">My Learning</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your progress and everything still in flight.
          </p>
        </div>
      </header>

      {summary && total > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile value={summary.completedModules} label="Completed" tint="var(--chart-1)" tone="solid" to="/my-learning" search={{ status: "completed" }} />
            <StatTile value={summary.inProgressCount} label="In progress" tint="var(--chart-2)" tone="solid" to="/my-learning" search={{ status: "in-progress" }} />
            <StatTile value={summary.overdueCount} label="Overdue" tint="var(--chart-5)" tone="soft" to="/my-learning" search={{ status: "overdue" }} />
            <StatTile value={pct} suffix="%" label="Overall" tint="var(--chart-3)" tone="soft" to="/my-learning" search={{ status: "all" }} />
          </div>

          <div className="surface mt-3 grid gap-4 p-5 sm:grid-cols-2">
            <Split
              label="Mandatory"
              complete={summary.mandatoryComplete}
              total={summary.mandatoryTotal}
            />
            <Split
              label="Optional"
              complete={summary.optionalComplete}
              total={summary.optionalTotal}
            />
          </div>
        </section>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-card-title">
          {status === "all" ? "Continue learning" : FILTER_LABEL[status]}
        </h2>
        {status !== "all" && (
          <Button asChild size="sm" variant="ghost" className="h-7">
            <Link to="/my-learning" search={{ status: "all" }}>
              Clear filter
            </Link>
          </Button>
        )}
      </div>

      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <ShimmerBlock key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing here yet"
          description="When a module is assigned to you it shows up here with its progress and due date."
        />
      ) : (
        <Stagger as="ul" className="space-y-3">
          {list.map((m) => (
            <StaggerItem
              as="li"
              key={m.id}
              className="surface card-hover relative overflow-hidden p-4 pl-5"
              style={{ ["--cat-tint" as string]: CATEGORY_TINT[m.category] }}
            >
              <span aria-hidden className="cat-accent absolute inset-y-0 left-0 w-[3px]" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <img
                  src={m.posterImage}
                  alt=""
                  loading="lazy"
                  width={1024}
                  height={576}
                  className="h-20 w-full shrink-0 rounded-xl border border-border object-cover sm:w-32"
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
                    <Progress
                      value={m.progressPct}
                      className="h-1.5 flex-1"
                      indicatorClassName={
                        m.category === "mandatory"
                          ? "bg-cat-mandatory"
                          : m.category === "onboarding"
                            ? "bg-cat-onboarding"
                            : m.category === "team"
                              ? "bg-cat-team"
                              : "bg-cat-bank"
                      }
                    />
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
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </PageFade>
  );
}

function Split({
  label,
  complete,
  total,
}: {
  label: string;
  complete: number;
  total: number;
}) {
  const pct = total ? Math.round((complete / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-label text-muted-foreground">{label}</p>
        <p className="tnum text-sm font-[510]">
          {complete} / {total}
        </p>
      </div>
      <Progress
        value={pct}
        className="mt-2 h-1.5"
        indicatorClassName={label === "Mandatory" ? "bg-cat-mandatory" : "bg-cat-team"}
      />
    </div>
  );
}
