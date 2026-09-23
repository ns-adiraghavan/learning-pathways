import type { PublishState } from "@/data/types";
import { cn } from "@/lib/utils";

export type StateFilterValue = PublishState | "all";

const OPTIONS: { value: StateFilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

/** Shared publish-state pill filter, so programs, skills and modules all slice the same way. */
export function StateFilterPills({
  value,
  onChange,
}: {
  value: StateFilterValue;
  onChange: (value: StateFilterValue) => void;
}) {
  return (
    <div className="flex gap-1.5" role="group" aria-label="Filter by state">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm transition-colors",
            value === o.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
