import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";

import { getLeaderboard } from "@/data/repositories";
import { EmptyState } from "@/components/lessons/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Lessons" },
      {
        name: "description",
        content: "How your completions compare across Netscribes teams this quarter.",
      },
      { property: "og:title", content: "Leaderboard — Lessons" },
      {
        property: "og:description",
        content: "How your completions compare across Netscribes teams this quarter.",
      },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { data, isPending } = useQuery({ queryKey: ["leaderboard"], queryFn: getLeaderboard });
  const rows = data ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-title">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">This quarter, across teams.</p>
      </header>

      {isPending ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No rankings yet"
          description="Standings appear once people start completing modules this quarter."
        />
      ) : (
        <div className="surface overflow-hidden">
          {rows.map((r) => (
            <div
              key={r.userId}
              className={cn(
                "flex items-center gap-3 border-b border-border px-4 py-3 last:border-0",
                r.isCurrentUser && "bg-primary/5",
              )}
            >
              <span className="tnum w-6 shrink-0 text-sm text-muted-foreground">{r.rank}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-[510]">
                  {r.name}
                  {r.isCurrentUser && (
                    <span className="ml-2 text-xs font-normal text-primary">You</span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">{r.team}</p>
              </div>
              <span className="tnum hidden text-xs text-muted-foreground sm:block">
                {r.modulesComplete} modules
              </span>
              <span className="tnum w-16 text-right text-sm font-[510]">{r.points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
