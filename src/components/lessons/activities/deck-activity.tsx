import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

import type { DeckActivity as DeckActivityType } from "@/data/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeckActivity({
  activity,
  onComplete,
  done,
}: {
  activity: DeckActivityType;
  onComplete: () => void;
  done: boolean;
}) {
  const [page, setPage] = useState(1);
  const [full, setFull] = useState(false);
  const atEnd = page >= activity.pages;

  return (
    <div className={cn("space-y-4", full && "fixed inset-0 z-50 bg-background p-4 sm:p-8")}>
      <div className="flex items-center justify-between gap-3">
        <p className="tnum text-sm text-muted-foreground">
          Page {page} of {activity.pages}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setFull((v) => !v)}>
          {full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          {full ? "Exit full screen" : "Full screen"}
        </Button>
      </div>

      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-border bg-card",
          full ? "h-[calc(100vh-11rem)]" : "aspect-[16/9]",
        )}
      >
        <div key={page} className="animate-soft-in px-8 text-center">
          <p className="text-label text-muted-foreground">{activity.name}</p>
          <p className="tnum mt-2 text-5xl font-[590] text-foreground/15">{page}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="size-4" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(activity.pages, p + 1))}
            disabled={atEnd}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button onClick={onComplete} disabled={!atEnd && !done}>
          {done ? "Continue" : "Mark as complete"}
        </Button>
      </div>
    </div>
  );
}
