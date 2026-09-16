import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layers, Plus } from "lucide-react";

import { getPrograms } from "@/data/repositories";
import { EmptyState } from "@/components/lessons/empty-state";
import { StatTile } from "@/components/lessons/count-up";
import { StateBadge } from "@/components/trainer/state-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PROGRAM_TINTS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)"] as const;

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
  const totals = programs.reduce(
    (sum, program) => ({
      skills: sum.skills + program.skillCount,
      modules: sum.modules + program.moduleCount,
      learners: sum.learners + program.learnerCount,
    }),
    { skills: 0, modules: 0, learners: 0 },
  );

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

      {!isPending && programs.length > 0 && (
        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Program summary">
          <StatTile label="Programs" value={programs.length} tint="var(--chart-1)" tone="solid" />
          <StatTile label="Skills" value={totals.skills} tint="var(--chart-2)" tone="solid" />
          <StatTile label="Modules" value={totals.modules} tint="var(--chart-3)" tone="soft" />
          <StatTile label="Learners" value={totals.learners} tint="var(--chart-4)" tone="soft" />
        </section>
      )}

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
          {programs.map((p, index) => (
            <article
              key={p.id}
              className="surface tinted-surface surface-hover relative overflow-hidden p-4 pl-5 sm:p-5 sm:pl-6"
              style={{ ["--tile-tint" as string]: PROGRAM_TINTS[index % PROGRAM_TINTS.length] }}
            >
              <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-(--tile-tint)" />
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
