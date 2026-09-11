import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronLeft, Plus } from "lucide-react";

import { getSkill } from "@/data/repositories";
import { EmptyState } from "@/components/lessons/empty-state";
import { StateBadge } from "@/components/trainer/state-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/trainer/skills/$skillId")({
  head: () => ({
    meta: [
      { title: "Skill modules — Lessons Trainer" },
      { name: "description", content: "Yearly modules that sit under this skill." },
      { property: "og:title", content: "Skill modules — Lessons Trainer" },
      { property: "og:description", content: "Yearly modules that sit under this skill." },
    ],
  }),
  component: SkillPage,
});

function SkillPage() {
  const { skillId } = Route.useParams();
  const { data, isPending } = useQuery({
    queryKey: ["skill", skillId],
    queryFn: () => getSkill(skillId),
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
          icon={BookOpen}
          title="Nothing to show"
          description="This skill has no modules yet, or no content is available."
        />
      ) : (
        <>
          <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="text-label text-muted-foreground">{data.skill.programTitle}</p>
              <h1 className="mt-0.5 text-title">{data.skill.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{data.skill.description}</p>
            </div>
            <Button size="sm" className="shrink-0">
              <Plus className="size-4" strokeWidth={2} />
              Add module
            </Button>
          </header>

          {data.modules.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No modules yet"
              description="Add this year's module to start building its content flow."
              action={<Button size="sm">Add module</Button>}
            />
          ) : (
            <div className="grid gap-3">
              {data.modules.map((m) => (
                <article key={m.id} className="surface surface-hover p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-card-title">{m.title}</h2>
                        <StateBadge state={m.state} />
                      </div>
                      <p className="tnum mt-2 text-xs text-muted-foreground">
                        {m.activityCount} activities · {m.enrolled} enrolled ·{" "}
                        {m.completionPct}% complete · updated {formatDate(m.updatedOn)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/trainer/modules/$moduleId" params={{ moduleId: m.id }}>
                          Edit
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost">
                        {m.state === "published" ? "Unpublish" : "Publish"}
                      </Button>
                    </div>
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
