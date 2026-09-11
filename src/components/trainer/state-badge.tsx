import { Check, Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PublishState } from "@/data/types";

export function StateBadge({ state }: { state: PublishState }) {
  const published = state === "published";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[12px] leading-none font-[510]",
        published ? "text-status-complete" : "text-muted-foreground",
      )}
    >
      {published ? (
        <Check className="size-3.5" strokeWidth={2.5} />
      ) : (
        <Circle className="size-3" strokeWidth={2} />
      )}
      {published ? "Published" : "Draft"}
    </span>
  );
}
