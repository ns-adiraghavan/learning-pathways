import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Layers } from "lucide-react";

import { getProgram } from "@/data/repositories";
import { EmptyState } from "@/components/lessons/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/trainer/programs/$programId")({
  head: () => ({
    meta: [
      { title: "Program skills — Lessons Trainer" },
      { name: "description", content: "Skills inside this Netscribes learning program." },
      { property: "og:title", content: "Program skills — Lessons Trainer" },
      {
        property: "og:description",
        content: "Skills inside this Netscribes learning program.",
      },
    ],
  }),
  component: ProgramPage,
});

function ProgramPage() {
  const { programId } = Route.useParams();
  const { data, isPending } = useQuery({
    queryKey: ["program", programId],
    queryFn: () => getProgram(programId),
  });

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/trainer/programs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={1.75} />
        Programs
      </Link>

      {!data ? (
        <EmptyState
          icon={Layers}
          title="Nothing to show"
          description="This program has no skills yet, or no content is available."
        />
      ) : (
        <>
          <header className="mb-6">
            <h1 className="text-title">{data.program.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {data.program.description}
            </p>
          </header>

          {data.skills.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No skills yet"
              description="Add a skill to start grouping this program's modules."
              action={<Button size="sm">Add skill</Button>}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.skills.map((s) => (
                <article key={s.id} className="surface surface-hover p-4">
                  <h2 className="text-card-title">{s.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                  <p className="tnum mt-3 text-xs text-muted-foreground">
                    {s.moduleCount} modules · {s.learnerCount} learners
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/trainer/skills/$skillId" params={{ skillId: s.id }}>
                        View modules
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost">
                      Add module
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
