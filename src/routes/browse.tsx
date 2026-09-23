import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, FolderTree, Layers, Library, Search } from "lucide-react";

import { getAssignedModules } from "@/data/repositories";
import type { LearningModule } from "@/data/types";
import { CATEGORY_LABEL, formatMinutes, moduleMinutes } from "@/lib/format";
import { EmptyState } from "@/components/lessons/empty-state";
import { PageFade, ShimmerBlock } from "@/components/motion/motion";
import { SearchBox } from "@/components/ui/search-box";
import { COVERS } from "@/lib/covers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse catalog — Lessons" },
      {
        name: "description",
        content: "Browse the catalog by program, skill and module.",
      },
      { property: "og:title", content: "Browse catalog — Lessons" },
      { property: "og:description", content: "Browse the catalog by program, skill and module." },
    ],
  }),
  component: BrowsePage,
});

const CAT_TINT: Record<LearningModule["category"], string> = {
  mandatory: "var(--cat-mandatory)",
  onboarding: "var(--cat-onboarding)",
  team: "var(--cat-team)",
  bank: "var(--cat-bank)",
};

const STATUS_DOT: Record<LearningModule["status"], string> = {
  overdue: "bg-status-overdue",
  "in-progress": "bg-status-progress",
  "not-started": "bg-muted-foreground/50",
  complete: "bg-status-complete",
};

const PROGRAM_TINTS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)", "var(--chart-3)"];

/** Deterministic cover art per program title, so tiles look consistent across visits. */
function programCover(title: string): string {
  let h = 2166136261;
  for (let i = 0; i < title.length; i += 1) {
    h ^= title.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return COVERS[(h >>> 0) % COVERS.length]!.dataUri;
}

interface SkillNode {
  skill: string;
  modules: LearningModule[];
  done: number;
}
interface ProgramNode {
  program: string;
  skills: SkillNode[];
  moduleCount: number;
  done: number;
}

function BrowsePage() {
  const { data: modules, isPending } = useQuery({
    queryKey: ["modules"],
    queryFn: getAssignedModules,
  });
  const [q, setQ] = useState("");
  const [openPrograms, setOpenPrograms] = useState<Set<string>>(new Set());
  const [openSkills, setOpenSkills] = useState<Set<string>>(new Set());

  const query = q.trim().toLowerCase();

  const programs = useMemo<ProgramNode[]>(() => {
    const all = modules ?? [];
    const filtered = query
      ? all.filter(
          (m) =>
            m.title.toLowerCase().includes(query) ||
            m.skillTitle.toLowerCase().includes(query) ||
            m.programTitle.toLowerCase().includes(query),
        )
      : all;

    const byProgram = new Map<string, Map<string, LearningModule[]>>();
    for (const m of filtered) {
      const skills = byProgram.get(m.programTitle) ?? new Map<string, LearningModule[]>();
      const list = skills.get(m.skillTitle) ?? [];
      list.push(m);
      skills.set(m.skillTitle, list);
      byProgram.set(m.programTitle, skills);
    }
    return Array.from(byProgram.entries())
      .map(([program, skillMap]) => {
        const skills = Array.from(skillMap.entries()).map(([skill, mods]) => ({
          skill,
          modules: mods,
          done: mods.filter((m) => m.status === "complete").length,
        }));
        return {
          program,
          skills,
          moduleCount: skills.reduce((n, s) => n + s.modules.length, 0),
          done: skills.reduce((n, s) => n + s.done, 0),
        };
      })
      .sort((a, b) => a.program.localeCompare(b.program));
  }, [modules, query]);

  // When searching, auto-expand every matching program and skill.
  const searching = query.length > 0;
  const isProgramOpen = (p: string) => searching || openPrograms.has(p);
  const isSkillOpen = (key: string) => searching || openSkills.has(key);

  const toggleProgram = (p: string) =>
    setOpenPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  const toggleSkill = (key: string) =>
    setOpenSkills((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <PageFade className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="page-header blue-wash mb-6">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Library className="size-6" strokeWidth={1.75} />
            </span>
            <div>
              <h1 className="text-title">Browse catalog</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Program → Skill → Module. Tap a program to open its skills and modules.
              </p>
            </div>
          </div>
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Search program, skill or module"
            ariaLabel="Search catalog"
            className="w-full sm:max-w-xs"
          />
        </div>
      </header>

      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <ShimmerBlock className="h-28 rounded-2xl" />
          <ShimmerBlock className="h-28 rounded-2xl" />
          <ShimmerBlock className="h-28 rounded-2xl" />
          <ShimmerBlock className="h-28 rounded-2xl" />
        </div>
      ) : programs.length === 0 ? (
        <EmptyState
          icon={query ? Search : FolderTree}
          title={query ? "No matches" : "Nothing to browse yet"}
          description={
            query
              ? `Nothing in the catalog matches “${q}”. Try a different term.`
              : "Programs and skills appear here once modules are published to your org."
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {programs.map((p, i) => {
            const open = isProgramOpen(p.program);
            const pct = p.moduleCount ? Math.round((p.done / p.moduleCount) * 100) : 0;
            return (
              <section
                key={p.program}
                className={cn(
                  "surface tinted-surface overflow-hidden p-0",
                  open && "sm:col-span-2",
                )}
                style={{ ["--tile-tint" as string]: PROGRAM_TINTS[i % PROGRAM_TINTS.length]! }}
              >
                <button
                  type="button"
                  onClick={() => toggleProgram(p.program)}
                  aria-expanded={open}
                  className="group block w-full text-left"
                >
                  {/* Cover banner — taller when collapsed (a real tile), a slim strip when open. */}
                  <span
                    className={cn(
                      "relative block w-full overflow-hidden transition-[height]",
                      open ? "h-16" : "h-28",
                    )}
                  >
                    <img
                      src={programCover(p.program)}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10"
                    />
                    <span className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-2">
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/20 text-white backdrop-blur-sm">
                            <Layers className="size-3.5" strokeWidth={2} />
                          </span>
                          <span className="truncate text-sm font-[610] text-white drop-shadow-sm">
                            {p.program}
                          </span>
                        </span>
                        {!open && (
                          <span className="tnum mt-1 block truncate text-[11px] text-white/85">
                            {p.skills.length} skill{p.skills.length === 1 ? "" : "s"} ·{" "}
                            {p.moduleCount} module{p.moduleCount === 1 ? "" : "s"} · {pct}% complete
                          </span>
                        )}
                      </span>
                      <ChevronRight
                        className={cn(
                          "size-5 shrink-0 text-white transition-transform",
                          open && "rotate-90",
                        )}
                        strokeWidth={2}
                      />
                    </span>
                  </span>
                  {/* Progress rail below the cover, only when collapsed. */}
                  {!open && (
                    <span className="block px-4 pb-3 pt-2.5">
                      <span className="block h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <span
                          className="block h-1.5 rounded-full bg-(--tile-tint)"
                          style={{ width: `${Math.max(3, pct)}%` }}
                        />
                      </span>
                    </span>
                  )}
                </button>

                {open && (
                  <div className="grid gap-2.5 border-t border-border bg-secondary/30 p-3 sm:p-4">
                    {p.skills.map((s) => {
                      const key = `${p.program}::${s.skill}`;
                      const sOpen = isSkillOpen(key);
                      return (
                        <div key={key} className="rounded-xl border border-border bg-card">
                          <button
                            type="button"
                            onClick={() => toggleSkill(key)}
                            aria-expanded={sOpen}
                            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                          >
                            <BookOpen
                              className="size-4 shrink-0 text-muted-foreground"
                              strokeWidth={1.75}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-[590]">{s.skill}</span>
                              <span className="tnum block text-xs text-muted-foreground">
                                {s.modules.length} module{s.modules.length === 1 ? "" : "s"} ·{" "}
                                {s.done}/{s.modules.length} done
                              </span>
                            </span>
                            <ChevronRight
                              className={cn(
                                "size-4 shrink-0 text-muted-foreground transition-transform",
                                sOpen && "rotate-90",
                              )}
                              strokeWidth={1.75}
                            />
                          </button>
                          {sOpen && (
                            <ul className="grid gap-2 border-t border-border p-2.5 sm:grid-cols-2">
                              {s.modules.map((m) => (
                                <li key={m.id}>
                                  <Link
                                    to="/modules/$moduleId"
                                    params={{ moduleId: m.id }}
                                    className="card-hover flex items-center gap-3 rounded-xl border border-border bg-card p-2.5"
                                    style={{ ["--cat-tint" as string]: CAT_TINT[m.category] }}
                                  >
                                    <img
                                      src={m.posterImage}
                                      alt=""
                                      loading="lazy"
                                      width={112}
                                      height={72}
                                      className="h-11 w-16 shrink-0 rounded-lg border border-border object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-[510]">{m.title}</p>
                                      <p className="tnum flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span
                                          className={cn(
                                            "size-1.5 rounded-full",
                                            STATUS_DOT[m.status],
                                          )}
                                        />
                                        {CATEGORY_LABEL[m.category]} ·{" "}
                                        {formatMinutes(moduleMinutes(m.activities))}
                                      </p>
                                    </div>
                                    <ChevronRight
                                      className="size-4 shrink-0 text-muted-foreground"
                                      strokeWidth={1.75}
                                    />
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </PageFade>
  );
}
