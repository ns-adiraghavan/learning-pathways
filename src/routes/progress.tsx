import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

import { getProgressSummary } from "@/data/repositories";
import { EmptyState } from "@/components/lessons/empty-state";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Lessons" },
      {
        name: "description",
        content: "Your standing across mandatory and optional modules, in one simple view.",
      },
      { property: "og:title", content: "Progress — Lessons" },
      {
        property: "og:description",
        content: "Your standing across mandatory and optional modules, in one simple view.",
      },
    ],
  }),
  component: ProgressPage,
});

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 500;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

function ProgressPage() {
  const { data, isPending } = useQuery({
    queryKey: ["progress-summary"],
    queryFn: getProgressSummary,
  });

  const total = data?.totalModules ?? 0;
  const complete = data?.completedModules ?? 0;
  const pct = total ? Math.round((complete / total) * 100) : 0;
  const shown = useCountUp(complete);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-title">Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">Where you stand right now.</p>
      </header>

      {isPending ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : total === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No progress to show yet"
          description="Once modules are assigned, your completion standing appears here."
        />
      ) : (
        <div className="space-y-4">
          <section className="surface p-6">
            <p className="tnum text-[34px] leading-tight font-[590]">
              {shown} of {total}
            </p>
            <p className="text-sm text-muted-foreground">modules complete</p>
            <Progress value={pct} className="mt-4 h-2" />
            <p className="tnum mt-2 text-xs text-muted-foreground">{pct}% overall</p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <SplitCard
              label="Mandatory"
              complete={data!.mandatoryComplete}
              total={data!.mandatoryTotal}
            />
            <SplitCard
              label="Optional"
              complete={data!.optionalComplete}
              total={data!.optionalTotal}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CountCard label="In progress" value={data!.inProgressCount} />
            <CountCard label="Overdue" value={data!.overdueCount} tone="text-status-overdue" />
          </div>
        </div>
      )}
    </div>
  );
}

function SplitCard({
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
    <section className="surface p-5">
      <p className="text-label text-muted-foreground">{label}</p>
      <p className="tnum mt-1 text-xl font-[510]">
        {complete} / {total}
      </p>
      <Progress value={pct} className="mt-3 h-1.5" />
    </section>
  );
}

function CountCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <section className="surface p-5">
      <p className="text-label text-muted-foreground">{label}</p>
      <p className={`tnum mt-1 text-xl font-[510] ${tone ?? ""}`}>{value}</p>
    </section>
  );
}
