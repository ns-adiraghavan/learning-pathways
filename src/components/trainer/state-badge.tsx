import { cn } from "@/lib/utils";
import type { PublishState } from "@/data/types";

export function StateBadge({ state }: { state: PublishState }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] leading-none font-[510]",
        state === "published"
          ? "border-status-complete/30 bg-status-complete/10 text-status-complete"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {state === "published" ? "Published" : "Draft"}
    </span>
  );
}
