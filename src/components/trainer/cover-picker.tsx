import { useState } from "react";
import { Check, Image as ImageIcon } from "lucide-react";

import { COVERS } from "@/lib/covers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Stock cover gallery. The trainer picks a cover while titling a module/quiz;
 * the chosen cover's data URI is written back to `posterImage`.
 */
export function CoverPicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (dataUri: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(value);

  const apply = () => {
    onSelect(picked);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setPicked(value);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-1">
          <ImageIcon className="size-4" strokeWidth={1.75} />
          Choose cover
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a cover</DialogTitle>
          <DialogDescription>
            Pick a stock cover for this module. The title sits on top, so these stay graphic.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto p-0.5 sm:grid-cols-3">
          {COVERS.map((cover) => {
            const selected = picked === cover.dataUri;
            return (
              <button
                key={cover.id}
                type="button"
                onClick={() => setPicked(cover.dataUri)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border text-left transition-all",
                  selected
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/40",
                )}
                aria-pressed={selected}
              >
                <img
                  src={cover.dataUri}
                  alt={cover.title}
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
                {selected && (
                  <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                )}
                <span className="block px-2.5 py-1.5 text-xs font-[510]">{cover.title}</span>
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={apply}>
            Use this cover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
