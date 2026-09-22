import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FolderTree, Layers, Library } from "lucide-react";

import { getAssignedModules } from "@/data/repositories";
import type { LearningModule } from "@/data/types";
import { CATEGORY_LABEL, formatMinutes, moduleMinutes } from "@/lib/format";
import { EmptyState } from "@/components/lessons/empty-state";
import { PageFade, ShimmerBlock } from "@/components/motion/motion";
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

interface Skill {
  skill: string;
  modules: LearningModule[];
}
interface Program {
  program: string;
  skills: Skill[];
  moduleCount: number;
}

function BrowsePage() {
  const { data: modules, isPending } = useQuery({
    queryKey: ["modules"],
    queryFn: getAssignedModules,
  });

  const programs = useMemo<Program[]>(() => {
    const all = modules ?? [];
    const byProgram = new Map<string, Map<string, LearningModule[]>>();
    for (const m of all) {
      const skills = byProgram.get(m.programTitle) ?? new Map<string, LearningModule[]>();
      const list = skills.get(m.skillTitle) ?? [];
      list.push(m);
      skills.set(m.skillTitle, list);
      byProgram.set(m.programTitle, skills);
    }
    return Array.from(byProgram.entries()).map(([program, skillMap]) => ({
      program,
      moduleCount: Array.from(skillMap.values()).reduce((n, l) => n + l.length, 0),
      skills: Array.from(skillMap.entries()).map(([skill, mods]) => ({ skill, modules: mods })),
    }));
  }, [modules]);

  return (
    <PageFade className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="page-header blue-wash mb-6">
        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Library className="size-6" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-title">Browse catalog</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Program → Skill → Module — the whole learning tree in one place.
            </p>
          </div>
        </div>
      </header>

      {isPending ? (
        <div className="grid gap-4">
          <ShimmerBlock className="h-40 rounded-2xl" />
          <ShimmerBlock className="h-40 rounded-2xl" />
        </div>
      ) : programs.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="Nothing to browse yet"
          description="Programs and skills appear here once modules are published to your org."
        />
      ) : (
        <div className="grid gap-6">
          {programs.map((p) => (
            <section key={p.program} className="surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <Layers className="size-4 text-primary" strokeWidth={1.75} />
                <h2 className="text-card-title">{p.program}</h2>
                <span className="tnum text-xs text-muted-foreground">
                  {p.skills.length} skills · {p.moduleCount} modules
                </span>
              </div>

              <div className="grid gap-4">
                {p.skills.map((s) => (
                  <div key={s.skill} className="sky-panel p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-[590]">{s.skill}</h3>
                      <span className="tnum text-xs text-muted-foreground">
                        {s.modules.length} module{s.modules.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <ul className="grid gap-2 sm:grid-cols-2">
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
                                  className={cn("size-1.5 rounded-full", STATUS_DOT[m.status])}
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
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageFade>
  );
}
