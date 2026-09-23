import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ChevronRight, ShieldCheck } from "lucide-react";

import { getMandatoryQuizzes, getReports } from "@/data/repositories";
import { EmptyState } from "@/components/lessons/empty-state";
import { CustomReportBuilder } from "@/components/reports/custom-report-builder";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const REPORT_TINTS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export const Route = createFileRoute("/admin/reports/")({
  head: () => ({
    meta: [
      { title: "Reports — Lessons Admin" },
      {
        name: "description",
        content: "Completion, time spent, points, logins and the audit log — sliced five ways.",
      },
      { property: "og:title", content: "Reports — Lessons Admin" },
      {
        property: "og:description",
        content: "Completion, time spent, points, logins and the audit log — sliced five ways.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [mandatoryOpen, setMandatoryOpen] = useState(false);
  const { data: reports = [], isPending } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: getReports,
  });
  const { data: mandatory = [] } = useQuery({
    queryKey: ["mandatory-quizzes"],
    queryFn: getMandatoryQuizzes,
    enabled: mandatoryOpen,
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-title">Reports &amp; Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Five report types, each sliced by dashboard, learner attributes, programs, learner and
            modules. Filter, then export any tab.
          </p>
        </div>
        <CustomReportBuilder />
      </header>

      {isPending ? (
        <div className="grid gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No reports available"
          description="Reports appear once learning activity has been recorded."
        />
      ) : (
        <div className="grid gap-3">
          {reports.map((r, index) => (
            <article
              key={r.id}
              className="surface tinted-surface card-hover relative overflow-hidden p-4 pl-5 sm:p-5 sm:pl-6"
              style={{ ["--tile-tint" as string]: REPORT_TINTS[index % REPORT_TINTS.length] }}
            >
              <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-(--tile-tint)" />
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-card-title">{r.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{r.lastRun}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link to="/admin/reports/$reportId" params={{ reportId: r.id }}>
                    Open
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Mandatory compliance — collapsed by default, lives under Reports */}
      <section className="surface mt-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setMandatoryOpen((v) => !v)}
          aria-expanded={mandatoryOpen}
          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/40"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-cat-mandatory/12 text-cat-mandatory">
            <ShieldCheck className="size-4" strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-card-title">Mandatory quiz compliance</span>
            <span className="block text-xs text-muted-foreground">
              Compliance-tracked quiz completion. Expand to view, or open the full tracker.
            </span>
          </span>
          <Link
            to="/admin/mandatory-quizzes"
            onClick={(e) => e.stopPropagation()}
            className="hidden text-sm font-[510] text-primary hover:underline sm:inline"
          >
            Open tracker
          </Link>
          <ChevronRight
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform",
              mandatoryOpen && "rotate-90",
            )}
            strokeWidth={1.75}
          />
        </button>
        {mandatoryOpen && (
          <div className="grid gap-2 border-t border-border p-3 sm:p-4">
            {mandatory.length === 0 ? (
              <p className="px-1 py-4 text-center text-sm text-muted-foreground">
                No mandatory quizzes flagged yet.
              </p>
            ) : (
              mandatory.map((q) => (
                <Link
                  key={q.id}
                  to="/admin/mandatory-quizzes/$quizId"
                  params={{ quizId: q.quizId }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-[510]">{q.quizName}</p>
                    <p className="truncate text-xs text-muted-foreground">{q.moduleTitle}</p>
                    <Progress
                      value={q.completionPct}
                      className="mt-2 h-1.5 max-w-64"
                      indicatorClassName="bg-cat-mandatory"
                    />
                  </div>
                  <span className="tnum shrink-0 text-sm font-[510]">
                    {q.completionPct}%
                    <span className="block text-xs font-normal text-muted-foreground">
                      {q.completed}/{q.enrolled}
                    </span>
                  </span>
                </Link>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
