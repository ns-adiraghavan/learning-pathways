import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, LayoutGrid, List, ListChecks, SearchX, Users } from "lucide-react";

import { searchModules } from "@/data/repositories";
import type { ActivityType, LearningModule, ModuleCategory } from "@/data/types";
import { CATEGORY_LABEL, formatMinutes, moduleMinutes } from "@/lib/format";
import { EmptyState } from "@/components/lessons/empty-state";
import { PageFade } from "@/components/motion/motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Sort = "relevance" | "shortest" | "enrolled";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { q: string; sort?: Sort } => ({
    q: String(search["q"] ?? ""),
    sort: (["relevance", "shortest", "enrolled"] as Sort[]).includes(search["sort"] as Sort)
      ? (search["sort"] as Sort)
      : "relevance",
  }),
  head: () => ({
    meta: [
      { title: "Search — Lessons" },
      { name: "description", content: "Search modules across Netscribes programs and skills." },
      { property: "og:title", content: "Search — Lessons" },
      {
        property: "og:description",
        content: "Search modules across Netscribes programs and skills.",
      },
    ],
  }),
  component: SearchPage,
});

const CAT_CHIP: Record<ModuleCategory, string> = {
  mandatory: "bg-cat-mandatory/12 text-cat-mandatory",
  onboarding: "bg-cat-onboarding/12 text-cat-onboarding",
  team: "bg-cat-team/12 text-cat-team",
  bank: "bg-cat-bank/12 text-cat-bank",
};

function SearchPage() {
  const { q, sort = "relevance" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [type, setType] = useState<ActivityType | "all">("all");

  const { data: results = [], isPending } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchModules(q),
    enabled: q.trim().length > 0,
  });

  const sorted = useMemo(() => {
    const list = results.filter((m) => type === "all" || m.activities.some((a) => a.type === type));
    if (sort === "shortest")
      list.sort((a, b) => moduleMinutes(a.activities) - moduleMinutes(b.activities));
    if (sort === "enrolled") list.sort((a, b) => b.enrolledCount - a.enrolledCount);
    return list;
  }, [results, sort, type]);

  return (
    <PageFade className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-5">
        <h1 className="text-title">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {q.trim()
            ? `${results.length} module${results.length === 1 ? "" : "s"} matching “${q}”`
            : "Search modules across programs and skills."}
        </p>
      </header>

      {q.trim() && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(
            [
              { value: "all", label: "All types" },
              { value: "video", label: "Videos" },
              { value: "deck", label: "Decks & slides" },
              { value: "quiz", label: "Quizzes" },
              { value: "weblink", label: "Links" },
            ] as { value: ActivityType | "all"; label: string }[]
          ).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors",
                type === t.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {q.trim() && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="inline-flex rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() => setLayout("list")}
              aria-label="List view"
              className={cn(
                "flex size-7 items-center justify-center rounded",
                layout === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <List className="size-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setLayout("grid")}
              aria-label="Grid view"
              className={cn(
                "flex size-7 items-center justify-center rounded",
                layout === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <LayoutGrid className="size-4" strokeWidth={1.75} />
            </button>
          </div>
          <Select
            value={sort}
            onValueChange={(v) => void navigate({ search: { q, sort: v as Sort } })}
          >
            <SelectTrigger className="h-9 w-44" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Sort: Relevance</SelectItem>
              <SelectItem value="shortest">Sort: Shortest first</SelectItem>
              <SelectItem value="enrolled">Sort: Most enrolled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!q.trim() ? (
        <EmptyState
          icon={SearchX}
          title="Type to search"
          description="Search for a module by title or topic — results show the skill, duration and contents."
        />
      ) : isPending ? (
        <p className="text-sm text-muted-foreground">Searching…</p>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No modules found"
          description={`Nothing matches “${q}”. Try a different term.`}
        />
      ) : layout === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((m) => (
            <ResultGrid key={m.id} module={m} />
          ))}
        </div>
      ) : (
        <ul className="grid gap-3">
          {sorted.map((m) => (
            <ResultRow key={m.id} module={m} />
          ))}
        </ul>
      )}
    </PageFade>
  );
}

function Meta({ module }: { module: LearningModule }) {
  return (
    <div className="tnum flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3.5" strokeWidth={1.75} />
        {formatMinutes(moduleMinutes(module.activities))}
      </span>
      <span className="inline-flex items-center gap-1">
        <ListChecks className="size-3.5" strokeWidth={1.75} />
        {module.activities.length} activities
      </span>
      <span className="inline-flex items-center gap-1">
        <Users className="size-3.5" strokeWidth={1.75} />
        {module.enrolledCount} enrolled
      </span>
    </div>
  );
}

function Tags({ module }: { module: LearningModule }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={cn("rounded-full px-2 py-0.5 text-xs font-[590]", CAT_CHIP[module.category])}
      >
        {CATEGORY_LABEL[module.category]}
      </span>
      <span className="chip-blue rounded-full px-2 py-0.5 text-xs">{module.skillTitle}</span>
      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
        Self-paced
      </span>
    </div>
  );
}

function ResultRow({ module }: { module: LearningModule }) {
  return (
    <li className="surface card-hover flex items-start gap-4 p-4">
      <img
        src={module.posterImage}
        alt=""
        loading="lazy"
        width={192}
        height={128}
        className="hidden h-20 w-28 shrink-0 rounded-xl border border-border object-cover sm:block"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{module.programTitle}</p>
        <h3 className="truncate text-card-title">
          <Link
            to="/modules/$moduleId"
            params={{ moduleId: module.id }}
            className="hover:text-primary"
          >
            {module.title}
          </Link>
        </h3>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{module.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Tags module={module} />
        </div>
        <div className="mt-2">
          <Meta module={module} />
        </div>
      </div>
    </li>
  );
}

function ResultGrid({ module }: { module: LearningModule }) {
  return (
    <Link
      to="/modules/$moduleId"
      params={{ moduleId: module.id }}
      className="surface card-hover group block overflow-hidden"
    >
      <img
        src={module.posterImage}
        alt=""
        loading="lazy"
        width={1024}
        height={576}
        className="aspect-[16/7] w-full border-b border-border object-cover"
      />
      <div className="p-4">
        <p className="text-xs text-muted-foreground">{module.programTitle}</p>
        <h3 className="truncate text-card-title group-hover:text-primary">{module.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{module.description}</p>
        <div className="mt-2.5">
          <Tags module={module} />
        </div>
        <div className="mt-2.5">
          <Meta module={module} />
        </div>
      </div>
    </Link>
  );
}
