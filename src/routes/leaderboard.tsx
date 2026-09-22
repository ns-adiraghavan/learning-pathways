import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Medal, Trophy, Users } from "lucide-react";

import { getLeaderboard } from "@/data/repositories";
import type { ReportChart } from "@/data/types";
import { EmptyState } from "@/components/lessons/empty-state";
import { ReportChartCard } from "@/components/reports/report-charts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DownloadCsvButton } from "@/components/download-csv-button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Lessons" },
      {
        name: "description",
        content: "How your completions compare across Netscribes teams — by period and team.",
      },
      { property: "og:title", content: "Leaderboard — Lessons" },
      {
        property: "og:description",
        content: "How your completions compare across Netscribes teams — by period and team.",
      },
    ],
  }),
  component: LeaderboardPage,
});

type Period = "week" | "month" | "quarter";
const PERIODS: { value: Period; label: string; factor: number }[] = [
  { value: "week", label: "This week", factor: 0.28 },
  { value: "month", label: "This month", factor: 0.55 },
  { value: "quarter", label: "This quarter", factor: 1 },
];

function LeaderboardPage() {
  const { data, isPending } = useQuery({ queryKey: ["leaderboard"], queryFn: getLeaderboard });
  const base = useMemo(() => data ?? [], [data]);

  const [period, setPeriod] = useState<Period>("quarter");
  const [team, setTeam] = useState("all");
  const [view, setView] = useState<"people" | "teams">("people");

  const factor = PERIODS.find((p) => p.value === period)!.factor;
  const teams = useMemo(() => Array.from(new Set(base.map((e) => e.team))).sort(), [base]);

  // Scale points to the selected period, then filter + re-rank.
  const scaled = useMemo(
    () => base.map((e) => ({ ...e, points: Math.round(e.points * factor) })),
    [base, factor],
  );

  const people = useMemo(() => {
    const list = (team === "all" ? scaled : scaled.filter((e) => e.team === team))
      .slice()
      .sort((a, b) => b.points - a.points);
    return list.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [scaled, team]);

  const teamRows = useMemo(() => {
    const map = new Map<
      string,
      { team: string; points: number; members: number; modules: number }
    >();
    scaled.forEach((e) => {
      const cur = map.get(e.team) ?? { team: e.team, points: 0, members: 0, modules: 0 };
      cur.points += e.points;
      cur.members += 1;
      cur.modules += e.modulesComplete;
      map.set(e.team, cur);
    });
    return Array.from(map.values())
      .sort((a, b) => b.points - a.points)
      .map((t, i) => ({ ...t, rank: i + 1 }));
  }, [scaled]);

  const chart: ReportChart =
    view === "people"
      ? {
          kind: "bar",
          title: "Points — top learners",
          series: people.slice(0, 8).map((e) => ({
            label: e.name,
            value: e.points,
            tint: e.isCurrentUser ? "var(--chart-4)" : "var(--chart-1)",
          })),
        }
      : {
          kind: "bar",
          title: "Points by team",
          series: teamRows.map((t) => ({ label: t.team, value: t.points, tint: "var(--chart-1)" })),
        };

  const me = people.find((e) => e.isCurrentUser);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="page-header blue-wash mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title">Leaderboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Points and completions across Netscribes teams.
          </p>
        </div>
        <DownloadCsvButton
          slug={`leaderboard-${view}-${period}`}
          headers={
            view === "people"
              ? ["Rank", "Name", "Team", "Modules complete", "Points"]
              : ["Rank", "Team", "Members", "Modules complete", "Points"]
          }
          rows={
            view === "people"
              ? people.map((r) => [r.rank, r.name, r.team, r.modulesComplete, r.points])
              : teamRows.map((r) => [r.rank, r.team, r.members, r.modules, r.points])
          }
        />
      </header>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-secondary p-0.5">
          {(["people", "teams"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors",
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "people" ? (
                <Trophy className="size-3.5" strokeWidth={1.75} />
              ) : (
                <Users className="size-3.5" strokeWidth={1.75} />
              )}
              {v === "people" ? "Individuals" : "By team"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          {view === "people" && (
            <Select value={team} onValueChange={setTeam}>
              <SelectTrigger className="h-9 w-40" aria-label="Team">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teams</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="h-9 w-40" aria-label="Period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : base.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No rankings yet"
          description="Standings appear once people start completing modules."
        />
      ) : (
        <div className="grid gap-5">
          {view === "people" && me && (
            <p className="text-sm text-muted-foreground">
              You're <span className="font-[590] text-foreground">#{me.rank}</span> of{" "}
              {people.length}
              {team === "all" ? " overall" : ` in ${team}`} with{" "}
              <span className="tnum font-[590] text-foreground">
                {me.points.toLocaleString("en-IN")}
              </span>{" "}
              points.
            </p>
          )}

          <ReportChartCard chart={chart} />

          <section className="surface overflow-hidden">
            {view === "people"
              ? people.map((r) => (
                  <div
                    key={r.userId}
                    className={cn(
                      "flex items-center gap-3 border-b border-border px-4 py-3 last:border-0",
                      r.isCurrentUser && "bg-primary/5",
                    )}
                  >
                    <Rank rank={r.rank} highlight={r.isCurrentUser} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm font-[510]",
                          r.isCurrentUser && "text-primary",
                        )}
                      >
                        {r.name}
                        {r.isCurrentUser && (
                          <span className="ml-2 rounded bg-primary px-1.5 text-[10px] font-[590] text-primary-foreground">
                            You
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{r.team}</p>
                    </div>
                    <span className="tnum hidden text-xs text-muted-foreground sm:block">
                      {r.modulesComplete} modules
                    </span>
                    <span className="tnum w-16 text-right text-sm font-[590]">
                      {r.points.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))
              : teamRows.map((r) => (
                  <div
                    key={r.team}
                    className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
                  >
                    <Rank rank={r.rank} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-[510]">{r.team}</p>
                      <p className="tnum truncate text-xs text-muted-foreground">
                        {r.members} member{r.members === 1 ? "" : "s"} · {r.modules} modules
                      </p>
                    </div>
                    <span className="tnum w-20 text-right text-sm font-[590]">
                      {r.points.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
          </section>
        </div>
      )}
    </div>
  );
}

function Rank({ rank, highlight }: { rank: number; highlight?: boolean }) {
  const medal =
    rank === 1
      ? "text-cat-bank"
      : rank === 2
        ? "text-muted-foreground"
        : rank === 3
          ? "text-secondary"
          : "";
  if (rank <= 3) {
    return (
      <span className="flex w-6 shrink-0 justify-center">
        <Medal className={cn("size-5", medal)} strokeWidth={1.75} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "tnum w-6 shrink-0 text-center text-sm",
        highlight ? "text-primary" : "text-muted-foreground",
      )}
    >
      {rank}
    </span>
  );
}
