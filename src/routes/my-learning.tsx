import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, Layers } from "lucide-react";

import { getAssignedModules } from "@/data/repositories";
import type { Activity, ActivityType, LearningModule, ModuleCategory } from "@/data/types";
import { CATEGORY_LABEL, formatDate, formatMinutes, moduleMinutes } from "@/lib/format";
import { EmptyState } from "@/components/lessons/empty-state";
import { PageFade, ShimmerBlock } from "@/components/motion/motion";
import { SearchBox } from "@/components/ui/search-box";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_VALUES = ["all", "in-progress", "overdue", "completed", "not-started"] as const;
type StatusFilter = (typeof STATUS_VALUES)[number];

export const Route = createFileRoute("/my-learning")({
  validateSearch: (search: Record<string, unknown>): { status: StatusFilter } => {
    const raw = String(search["status"] ?? "all") as StatusFilter;
    return { status: STATUS_VALUES.includes(raw) ? raw : "all" };
  },
  head: () => ({
    meta: [
      { title: "My Learning — Lessons" },
      {
        name: "description",
        content:
          "Every module you're assigned, module by module — progress, contents, due dates and status.",
      },
      { property: "og:title", content: "My Learning — Lessons" },
      {
        property: "og:description",
        content:
          "Every module you're assigned, module by module — progress, contents, due dates and status.",
      },
    ],
  }),
  component: MyLearningPage,
});

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in-progress", label: "In progress" },
  { value: "overdue", label: "Overdue" },
  { value: "not-started", label: "Not started" },
  { value: "completed", label: "Completed" },
];

const CATS: ModuleCategory[] = ["mandatory", "onboarding", "team", "bank"];

const CAT_TINT: Record<ModuleCategory, string> = {
  mandatory: "var(--cat-mandatory)",
  onboarding: "var(--cat-onboarding)",
  team: "var(--cat-team)",
  bank: "var(--cat-bank)",
};

const CAT_CHIP: Record<ModuleCategory, string> = {
  mandatory: "bg-cat-mandatory/12 text-cat-mandatory",
  onboarding: "bg-cat-onboarding/12 text-cat-onboarding",
  team: "bg-cat-team/12 text-cat-team",
  bank: "bg-cat-bank/12 text-cat-bank",
};

const STATUS_DOT: Record<LearningModule["status"], { dot: string; label: string; text?: string }> =
  {
    overdue: { dot: "bg-status-overdue", label: "Overdue", text: "text-status-overdue" },
    "in-progress": { dot: "bg-status-progress", label: "In progress" },
    "not-started": { dot: "bg-muted-foreground/50", label: "Not started" },
    complete: { dot: "bg-status-complete", label: "Complete" },
  };

const TYPE_LABEL: Record<ActivityType, string> = {
  video: "video",
  deck: "deck",
  weblink: "link",
  quiz: "quiz",
};

function contents(activities: Activity[]): string {
  const counts = activities.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});
  return (["video", "deck", "weblink", "quiz"] as ActivityType[])
    .filter((t) => counts[t])
    .map((t) => `${counts[t]} ${TYPE_LABEL[t]}${counts[t]! > 1 ? "s" : ""}`)
    .join(" · ");
}

interface ProgramGroup {
  program: string;
  modules: LearningModule[];
  done: number;
  skills: { skill: string; modules: LearningModule[] }[];
}

function matchesStatus(m: LearningModule, f: StatusFilter): boolean {
  if (f === "all") return true;
  if (f === "completed") return m.status === "complete";
  if (f === "in-progress") return m.status === "in-progress";
  if (f === "overdue") return m.status === "overdue";
  return m.status === "not-started";
}

function MyLearningPage() {
  const { status } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");
  const [program, setProgram] = useState("all");
  const [category, setCategory] = useState<ModuleCategory | "all">("all");

  const { data: modules, isPending } = useQuery({
    queryKey: ["modules"],
    queryFn: getAssignedModules,
  });
  const all = useMemo(() => modules ?? [], [modules]);

  const programs = useMemo(() => Array.from(new Set(all.map((m) => m.programTitle))).sort(), [all]);

  const byCategory = useMemo(
    () =>
      CATS.map((c) => {
        const list = all.filter((m) => m.category === c);
        return {
          category: c,
          total: list.length,
          done: list.filter((m) => m.status === "complete").length,
        };
      }).filter((c) => c.total > 0),
    [all],
  );

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return all
      .filter((m) => matchesStatus(m, status))
      .filter((m) => program === "all" || m.programTitle === program)
      .filter((m) => category === "all" || m.category === category)
      .filter(
        (m) =>
          !query ||
          m.title.toLowerCase().includes(query) ||
          m.skillTitle.toLowerCase().includes(query) ||
          m.programTitle.toLowerCase().includes(query),
      )
      .sort((a, b) => b.progressPct - a.progressPct || a.title.localeCompare(b.title));
  }, [all, status, program, q, category]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f.value, all.filter((m) => matchesStatus(m, f.value)).length]),
      ),
    [all],
  );

  // Group the filtered modules by program → skill. Programs with more than one
  // module in view render as a titled section; a lone module renders on its own.
  const groups = useMemo<ProgramGroup[]>(() => {
    const byProgram = new Map<string, LearningModule[]>();
    for (const m of rows) {
      const list = byProgram.get(m.programTitle) ?? [];
      list.push(m);
      byProgram.set(m.programTitle, list);
    }
    return Array.from(byProgram.entries())
      .map(([program, mods]) => {
        const bySkill = new Map<string, LearningModule[]>();
        for (const m of mods) {
          const list = bySkill.get(m.skillTitle) ?? [];
          list.push(m);
          bySkill.set(m.skillTitle, list);
        }
        return {
          program,
          modules: mods,
          done: mods.filter((m) => m.status === "complete").length,
          skills: Array.from(bySkill.entries()).map(([skill, modules]) => ({ skill, modules })),
        };
      })
      .sort((a, b) => b.modules.length - a.modules.length || a.program.localeCompare(b.program));
  }, [rows]);

  return (
    <PageFade className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-title">My Learning</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every module you're assigned, module by module — contents, progress and due dates.
        </p>
      </header>

      {/* Completion by category — the broader, module-wise read */}
      {byCategory.length > 0 && (
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {byCategory.map((c) => {
            const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
            const active = category === c.category;
            return (
              <button
                key={c.category}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory((prev) => (prev === c.category ? "all" : c.category))}
                className={cn(
                  "surface card-hover p-4 text-left transition-shadow",
                  active && "ring-2 ring-primary/40",
                )}
                style={{ ["--cat-tint" as string]: CAT_TINT[c.category] }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-label text-muted-foreground">
                    {CATEGORY_LABEL[c.category]}
                  </span>
                  <span className="tnum text-xs text-muted-foreground">
                    {c.done}/{c.total}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${Math.max(3, pct)}%`, background: "var(--cat-tint)" }}
                  />
                </div>
                <p className="tnum mt-1.5 text-xs text-muted-foreground">
                  {active ? "Filtering — tap to clear" : `${pct}% complete`}
                </p>
              </button>
            );
          })}
        </section>
      )}

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => void navigate({ search: { status: f.value } })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors",
                status === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className="tnum text-xs opacity-80">{counts[f.value]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <SearchBox value={q} onChange={setQ} placeholder="Search modules" className="w-44" />
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger className="h-9 w-auto min-w-36" aria-label="Filter by program">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending ? (
        <div className="grid gap-3">
          {[0, 1, 2, 3].map((i) => (
            <ShimmerBlock key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing here"
          description="No modules match this filter. Clear it, or check another status tab."
        />
      ) : (
        <div className="grid gap-5">
          {groups.map((g) => {
            // A single module in a program: render it on its own, no section chrome.
            if (g.modules.length === 1) {
              return <ModuleCard key={g.modules[0]!.id} m={g.modules[0]!} />;
            }
            const pct = g.modules.length ? Math.round((g.done / g.modules.length) * 100) : 0;
            const multiSkill = g.skills.length > 1;
            return (
              <section key={g.program} className="grid gap-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-0.5">
                  <span className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Layers className="size-3.5" strokeWidth={2} />
                    </span>
                    <h2 className="text-card-title">{g.program}</h2>
                  </span>
                  <span className="tnum text-xs text-muted-foreground">
                    {g.modules.length} modules · {g.done}/{g.modules.length} done
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                      <span
                        className="block h-1.5 rounded-full bg-primary"
                        style={{ width: `${Math.max(3, pct)}%` }}
                      />
                    </span>
                    <span className="tnum text-xs text-muted-foreground">{pct}%</span>
                  </span>
                </div>
                <div className="grid gap-2.5 border-l-2 border-border pl-3 sm:pl-4">
                  {g.skills.map((s) => (
                    <div key={s.skill} className="grid gap-2.5">
                      {multiSkill && (
                        <p className="text-label px-0.5 pt-1 text-muted-foreground">
                          {s.skill}
                          <span className="tnum ml-1.5 font-normal normal-case">
                            · {s.modules.length} module{s.modules.length === 1 ? "" : "s"}
                          </span>
                        </p>
                      )}
                      {s.modules.map((m) => (
                        <ModuleCard key={m.id} m={m} />
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PageFade>
  );
}

function ModuleCard({ m }: { m: LearningModule }) {
  const s = STATUS_DOT[m.status];
  return (
    <div
      className="surface card-hover flex items-center gap-4 p-4"
      style={{ ["--cat-tint" as string]: CAT_TINT[m.category] }}
    >
      <img
        src={m.posterImage}
        alt=""
        loading="lazy"
        width={192}
        height={128}
        className="hidden h-16 w-24 shrink-0 rounded-xl border border-border object-cover sm:block"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn("rounded-full px-2.5 py-0.5 text-xs font-[590]", CAT_CHIP[m.category])}
          >
            {CATEGORY_LABEL[m.category]}
          </span>
          <span
            className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", s.text)}
          >
            <span className={cn("size-1.5 rounded-full", s.dot)} />
            {s.label}
          </span>
        </div>
        <h3 className="mt-1 truncate text-card-title">
          <Link to="/modules/$moduleId" params={{ moduleId: m.id }} className="hover:text-primary">
            {m.title}
          </Link>
        </h3>
        <p className="truncate text-xs text-muted-foreground">
          {m.programTitle} › {m.skillTitle}
        </p>
        <p className="tnum mt-0.5 text-xs text-muted-foreground">
          {contents(m.activities)} · {formatMinutes(moduleMinutes(m.activities))} · due{" "}
          {formatDate(m.dueDate)}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-1.5 rounded-full"
              style={{ width: `${Math.max(2, m.progressPct)}%`, background: "var(--cat-tint)" }}
            />
          </div>
          <span className="tnum text-xs text-muted-foreground">{m.progressPct}%</span>
        </div>
      </div>
      <Link
        to="/modules/$moduleId"
        params={{ moduleId: m.id }}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[color:var(--brand-blue-soft)] bg-secondary px-4 py-1.5 text-sm font-[510] text-primary transition-colors hover:bg-accent"
      >
        Open <ChevronRight className="size-4" strokeWidth={1.75} />
      </Link>
    </div>
  );
}
