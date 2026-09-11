import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";

import { getReports } from "@/data/repositories";
import { EmptyState } from "@/components/lessons/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/reports/")({
  head: () => ({
    meta: [
      { title: "Reports — Lessons Admin" },
      {
        name: "description",
        content: "Completion ratio, time spent, leaderboard points and the audit log.",
      },
      { property: "og:title", content: "Reports — Lessons Admin" },
      {
        property: "og:description",
        content: "Completion ratio, time spent, leaderboard points and the audit log.",
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
      <header className="mb-6">
        <h1 className="text-title">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Four report types. Filter by period and org, then export or schedule.
        </p>
      </header>

      {isPending ? (
        <div className="grid gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
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
          {reports.map((r) => (
            <article key={r.id} className="surface surface-hover p-4 sm:p-5">
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
    </div>
  );
}
