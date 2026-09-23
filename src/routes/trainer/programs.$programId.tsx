import { type ReactNode, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Layers, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { createSkill, getProgram } from "@/data/repositories";
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
import { Textarea } from "@/components/ui/textarea";

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
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilterValue>("all");
  const { data, isPending } = useQuery({
    queryKey: ["program", programId],
    queryFn: () => getProgram(programId),
  });

  const skills = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = data?.skills ?? [];
    return list.filter(
      (s) =>
        (stateFilter === "all" || s.state === stateFilter) &&
        (!query ||
          s.title.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)),
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
          icon={Layers}
          title="Nothing to show"
          description="This program has no skills yet, or no content is available."
        />
      ) : (
        <>
          <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-title">{data.program.title}</h1>
                <StateBadge state={data.program.state} />
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {data.program.description}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <PublishControl
                id={data.program.id}
                state={data.program.state}
                kind="program"
                invalidateKeys={[["program", programId], ["programs"]]}
              />
              <AddSkillDialog
                programId={programId}
                trigger={
                  <Button size="sm">
                    <Plus className="size-4" strokeWidth={2} />
                    Add skill
                  </Button>
                }
              />
            </div>
          </header>

          {data.skills.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <SearchBox
                value={q}
                onChange={setQ}
                placeholder="Search skills"
                className="min-w-0 flex-1 sm:max-w-xs"
              />
              <StateFilterPills value={stateFilter} onChange={setStateFilter} />
            </div>
          )}

          {data.skills.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No skills yet"
              description="Add a skill to start grouping this program's modules."
              action={
                <AddSkillDialog
                  programId={programId}
                  trigger={<Button size="sm">Add skill</Button>}
                />
              }
            />
          ) : skills.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No skills match"
              description="Nothing matches this search. Clear it to see all skills."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {skills.map((s) => (
                <article key={s.id} className="surface surface-hover p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="min-w-0 truncate text-card-title">{s.title}</h2>
                    <StateBadge state={s.state} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                  <p className="tnum mt-3 text-xs text-muted-foreground">
                    {s.moduleCount} modules · {s.learnerCount} learners
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/trainer/skills/$skillId" params={{ skillId: s.id }}>
                        View modules
                        <ChevronRight className="size-4" strokeWidth={1.75} />
                      </Link>
                    </Button>
                    <PublishControl
                      id={s.id}
                      state={s.state}
                      kind="skill"
                      invalidateKeys={[["program", programId]]}
                    />
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

function AddSkillDialog({ programId, trigger }: { programId: string; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createSkill(programId, { title: title.trim(), description: description.trim() }),
    onSuccess: (skill) => {
      toast.success("Skill added — add its first module");
      setOpen(false);
      setTitle("");
      setDescription("");
      void queryClient.invalidateQueries({ queryKey: ["program", programId] });
      void navigate({ to: "/trainer/skills/$skillId", params: { skillId: skill.id } });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add skill</DialogTitle>
          <DialogDescription>
            A skill groups the yearly modules that teach it. It starts as a draft.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="as-title">Skill title</Label>
            <Input
              id="as-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Information Security"
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="as-desc">Description</Label>
            <Textarea
              id="as-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this skill covers."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!title.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            Add skill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
