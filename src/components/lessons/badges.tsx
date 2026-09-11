import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, STATUS_DOT, STATUS_LABEL } from "@/lib/format";
import type { Difficulty, ModuleCategory, ModuleStatus } from "@/data/types";

export function CategoryBadge({ category }: { category: ModuleCategory }) {
  const tone =
    category === "mandatory"
      ? "text-status-mandatory border-status-mandatory/30 bg-status-mandatory/10"
      : "text-status-category border-status-category/30 bg-status-category/10";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] leading-none font-[510]",
        tone,
      )}
    >
      {CATEGORY_LABEL[category]}
    </span>
  );
}

export function StatusDot({ status, withLabel }: { status: ModuleStatus; withLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[status])} />
      {withLabel && STATUS_LABEL[status]}
    </span>
  );
}

export function RequiredBadge() {
  return (
    <span className="inline-flex items-center rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[11px] leading-none font-[510] text-muted-foreground">
      Required
    </span>
  );
}

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  easy: "text-difficulty-easy border-difficulty-easy/30 bg-difficulty-easy/10",
  medium: "text-difficulty-medium border-difficulty-medium/30 bg-difficulty-medium/10",
  hard: "text-difficulty-hard border-difficulty-hard/30 bg-difficulty-hard/10",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] leading-none font-[510] capitalize",
        DIFFICULTY_TONE[difficulty],
      )}
    >
      {difficulty}
    </span>
  );
}
