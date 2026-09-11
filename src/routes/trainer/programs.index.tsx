import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layers, Plus } from "lucide-react";

import { getPrograms } from "@/data/repositories";
import { EmptyState } from "@/components/lessons/empty-state";
import { StateBadge } from "@/components/trainer/state-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/trainer/programs/")({
  head: () => ({
    meta: [
      { title: "Programs — Lessons Trainer" },
      {
        name: "description",
        content: "Author and publish Netscribes learning programs, skills and modules.",
      },
      { property: "og:title", content: "Programs — Lessons Trainer" },
      {
        property: "og:description",
        content: "Author and publish Netscribes learning programs, skills and modules.",
      },
    ],
  }),
  component: ProgramsPage,
});

function ProgramsPage() {
  const { data, isPending } = useQuery({ queryKey: ["programs"], queryFn: getPrograms });
  const programs = data ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-title">Programs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Program → Skill → Module. Start here to author content.
          </p>
        </div>
        <Button size="sm" className="shrink-0">
          <Plus className="size-4" strokeWidth={2} />
          New program
        </Button>
      </header>

      {isPending ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No programs yet"
          description="Create a program to group skills and their yearly modules."
          action={<Button size="sm">Create program</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {programs.map((p) => (
            <article key={p.id} className="surface surface-hover p-4 sm:p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-card-title">{p.title}</h2>
                    <StateBadge state={p.state} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                  <p className="tnum mt-3 text-xs text-muted-foreground">
                    {p.skillCount} skills · {p.moduleCount} modules · {p.learnerCount} learners ·
                    Owner {p.owner}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/trainer/programs/$programId" params={{ programId: p.id }}>
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
