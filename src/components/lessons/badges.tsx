import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, STATUS_DOT, STATUS_LABEL } from "@/lib/format";
import type { Difficulty, ModuleCategory, ModuleStatus } from "@/data/types";

export const CATEGORY_TINT: Record<ModuleCategory, string> = {
  mandatory: "var(--cat-mandatory)",
  onboarding: "var(--cat-onboarding)",
  team: "var(--cat-team)",
  bank: "var(--cat-bank)",
};

export function CategoryBadge({ category }: { category: ModuleCategory }) {
  return (
    <span
      className="inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] leading-none font-[510]"
      style={{
        color: CATEGORY_TINT[category],
        borderColor: `color-mix(in oklab, ${CATEGORY_TINT[category]} 30%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${CATEGORY_TINT[category]} 10%, transparent)`,
      }}
    >
      {CATEGORY_LABEL[category]}
    </span>
  );
}

export function StatusDot({ status, withLabel }: { status: ModuleStatus; withLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          STATUS_DOT[status],
          status === "overdue" && "animate-dot-pulse",
        )}
      />
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
