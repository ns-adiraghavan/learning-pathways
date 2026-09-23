import { type ReactNode, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronLeft, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { createModuleDraft, getSkill } from "@/data/repositories";
import { EmptyState } from "@/components/lessons/empty-state";
import { StateBadge } from "@/components/trainer/state-badge";
import { PublishControl } from "@/components/trainer/publish-control";
import { StateFilterPills, type StateFilterValue } from "@/components/trainer/state-filter";
import { SearchBox } from "@/components/ui/search-box";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilterValue>("all");
  const { data, isPending } = useQuery({
    queryKey: ["skill", skillId],
    queryFn: () => getSkill(skillId),
  });

  const modules = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = data?.modules ?? [];
    return list.filter(
      (m) =>
        (stateFilter === "all" || m.state === stateFilter) &&
        (!query || m.title.toLowerCase().includes(query)),
    );
  }, [data, q, stateFilter]);

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
              <div className="mt-0.5 flex items-center gap-2">
                <h1 className="truncate text-title">{data.skill.title}</h1>
                <StateBadge state={data.skill.state} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{data.skill.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <PublishControl
                id={data.skill.id}
                state={data.skill.state}
                kind="skill"
                invalidateKeys={[["skill", skillId]]}
              />
              <AddModuleDialog
                skillId={skillId}
                trigger={
                  <Button size="sm">
                    <Plus className="size-4" strokeWidth={2} />
                    Add module
                  </Button>
                }
              />
            </div>
          </header>

          {data.modules.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <SearchBox
                value={q}
                onChange={setQ}
                placeholder="Search modules"
                className="min-w-0 flex-1 sm:max-w-xs"
              />
              <StateFilterPills value={stateFilter} onChange={setStateFilter} />
            </div>
          )}

          {data.modules.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No modules yet"
              description="Add this year's module to start building its content flow."
              action={
                <AddModuleDialog
                  skillId={skillId}
                  trigger={<Button size="sm">Add module</Button>}
                />
              }
            />
          ) : modules.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No modules match"
              description="Nothing matches this search. Clear it to see all modules."
            />
          ) : (
            <div className="grid gap-3">
              {modules.map((m) => (
                <Link
                  key={m.id}
                  to="/trainer/modules/$moduleId"
                  params={{ moduleId: m.id }}
                  className="surface surface-hover block p-4"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-card-title">{m.title}</h2>
                        <StateBadge state={m.state} />
                      </div>
                      <p className="tnum mt-2 text-xs text-muted-foreground">
                        {m.activityCount} activities · {m.enrolled} enrolled · {m.completionPct}%
                        complete · updated {formatDate(m.updatedOn)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      <PublishControl
                        id={m.id}
                        state={m.state}
                        kind="module"
                        invalidateKeys={[
                          ["skill", skillId],
                          ["module-draft", m.id],
                        ]}
                      />
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-[510] text-primary-foreground">
                        <Pencil className="size-3.5" strokeWidth={1.75} />
                        Edit
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AddModuleDialog({ skillId, trigger }: { skillId: string; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => createModuleDraft(skillId, { title: title.trim() }),
    onSuccess: (draft) => {
      toast.success("Fresh module created — build its content flow");
      setOpen(false);
      setTitle("");
      void navigate({ to: "/trainer/modules/$moduleId", params: { moduleId: draft.id } });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add module</DialogTitle>
          <DialogDescription>
            Give it a name and we'll open a fresh module setup — content flow, settings and
            audience, all empty and ready to build.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="am-title">Module title</Label>
          <Input
            id="am-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Information Security 2027"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim() && !mutation.isPending) mutation.mutate();
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!title.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            Create &amp; open
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
