import { useEffect, useState } from "react";

import type { QuizResult } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProgressRing } from "@/components/lessons/progress-ring";

export function ScorecardDialog({
  result,
  open,
  onDone,
}: {
  result: QuizResult | null;
  open: boolean;
  onDone: () => void;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!open || !result) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      setShown(Math.round(result.scorePct * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, result]);

  if (!result) return null;

  const right = result.breakup.reduce((s, b) => s + b.right, 0);
  const wrong = result.breakup.reduce((s, b) => s + b.wrong, 0);
  const skipped = result.breakup.reduce((s, b) => s + b.unanswered, 0);

  const stats: { label: string; value: number; tint: string }[] = [
    { label: "Correct", value: right, tint: "var(--color-status-complete)" },
    { label: "Incorrect", value: wrong, tint: "var(--color-status-overdue)" },
    { label: "Skipped", value: skipped, tint: "var(--color-muted-foreground)" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onDone()}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="sr-only">Quiz result</DialogTitle>
        <div className="flex flex-col items-center text-center">
          <span
            className="text-label mb-4 rounded-full px-2.5 py-1"
            style={{
              color: result.passed ? "var(--color-status-complete)" : "var(--color-status-overdue)",
              backgroundColor: result.passed
                ? "color-mix(in oklab, var(--color-status-complete) 12%, transparent)"
                : "color-mix(in oklab, var(--color-status-overdue) 12%, transparent)",
            }}
          >
            {result.passed ? "PASSED" : "FAILED"}
          </span>
          <div className="relative mb-4 inline-flex items-center justify-center">
            <ProgressRing
              value={shown}
              size={124}
              stroke={8}
              showLabel={false}
              color={result.passed ? "var(--color-status-complete)" : "var(--color-status-overdue)"}
            />
            <span className="tnum absolute text-3xl font-[590]">{shown}%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {right} of {result.totalQuestions} correct · pass mark {result.passMarkPct}%
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border py-2.5 text-center">
              <p className="tnum text-xl font-[590]" style={{ color: s.tint }}>
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Button className="mt-5 w-full" onClick={onDone}>
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
