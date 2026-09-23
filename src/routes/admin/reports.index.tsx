import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ChevronRight, ShieldCheck } from "lucide-react";

import { getReports } from "@/data/repositories";
import { EmptyState } from "@/components/lessons/empty-state";
import { CustomReportBuilder } from "@/components/reports/custom-report-builder";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { data: reports = [], isPending } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: getReports,
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

      {/* Mandatory compliance now lives inside the Completion report */}
      <Link
        to="/admin/reports/$reportId"
        params={{ reportId: "completion-ratio" }}
        className="surface card-hover mt-4 flex items-center gap-3 p-4"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-cat-mandatory/12 text-cat-mandatory">
          <ShieldCheck className="size-4" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-card-title">Mandatory quiz compliance</span>
          <span className="block text-xs text-muted-foreground">
            Now inside the Completion report — open it, go to By Modules, and switch on “Mandatory
            only” for scores, pass/fail and certificates.
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      </Link>
    </div>
  );
}
