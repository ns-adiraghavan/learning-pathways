import { type ReactNode, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Layers, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { createProgram, getPrograms } from "@/data/repositories";
import { EmptyState } from "@/components/lessons/empty-state";
import { StatTile } from "@/components/lessons/count-up";
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
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilterValue>("all");

  const programs = useMemo(() => data ?? [], [data]);
  const totals = programs.reduce(
    (sum, program) => ({
      skills: sum.skills + program.skillCount,
      modules: sum.modules + program.moduleCount,
      learners: sum.learners + program.learnerCount,
    }),
    { skills: 0, modules: 0, learners: 0 },
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return programs.filter(
      (p) =>
        (stateFilter === "all" || p.state === stateFilter) &&
        (!query ||
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.owner.toLowerCase().includes(query)),
    );
  }, [programs, q, stateFilter]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-title">Programs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Program → Skill → Module. Start here to author content.
          </p>
        </div>
        <NewProgramDialog
          trigger={
            <Button size="sm" className="shrink-0">
              <Plus className="size-4" strokeWidth={2} />
              New program
            </Button>
          }
        />
      </header>

      {!isPending && programs.length > 0 && (
        <section
          className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label="Program summary"
        >
          <StatTile label="Programs" value={programs.length} tint="var(--chart-1)" tone="solid" />
          <StatTile label="Skills" value={totals.skills} tint="var(--chart-2)" tone="solid" />
          <StatTile label="Modules" value={totals.modules} tint="var(--chart-3)" tone="soft" />
          <StatTile label="Learners" value={totals.learners} tint="var(--chart-4)" tone="soft" />
        </section>
      )}

      {/* Search + state filter — the shared pattern used across programs, skills and modules */}
      {!isPending && programs.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Search programs or owners"
            className="min-w-0 flex-1 sm:max-w-xs"
          />
          <StateFilterPills value={stateFilter} onChange={setStateFilter} />
        </div>
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
          action={<NewProgramDialog trigger={<Button size="sm">Create program</Button>} />}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No programs match"
          description="Nothing matches this search or filter. Clear it to see everything."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((p, index) => (
            <Link
              key={p.id}
              to="/trainer/programs/$programId"
              params={{ programId: p.id }}
              className="surface tinted-surface surface-hover relative block overflow-hidden p-4 pl-5 sm:p-5 sm:pl-6"
              style={{ ["--tile-tint" as string]: PROGRAM_TINTS[index % PROGRAM_TINTS.length] }}
            >
              <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-(--tile-tint)" />
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-card-title">{p.title}</h2>
                    <StateBadge state={p.state} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  <p className="tnum mt-3 text-xs text-muted-foreground">
                    {p.skillCount} skills · {p.moduleCount} modules · {p.learnerCount} learners ·
                    Owner {p.owner}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <PublishControl
                    id={p.id}
                    state={p.state}
                    kind="program"
                    invalidateKeys={[["programs"]]}
                  />
                  <span className="inline-flex items-center gap-1 text-sm font-[510] text-primary">
                    Open
                    <ChevronRight className="size-4" strokeWidth={1.75} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NewProgramDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createProgram({ title: title.trim(), description: description.trim(), owner: owner.trim() }),
    onSuccess: (program) => {
      toast.success("Program created — add its first skill");
      setOpen(false);
      setTitle("");
      setDescription("");
      setOwner("");
      void queryClient.invalidateQueries({ queryKey: ["programs"] });
      void navigate({ to: "/trainer/programs/$programId", params: { programId: program.id } });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New program</DialogTitle>
          <DialogDescription>
            A program groups related skills and their yearly modules. It starts as a draft.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="np-title">Program title</Label>
            <Input
              id="np-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Leadership Track"
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="np-desc">Description</Label>
            <Textarea
              id="np-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this program covers and who it's for."
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="np-owner">Owner (optional)</Label>
            <Input
              id="np-owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Program owner"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!title.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            Create program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
