import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { QuizResult } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProgressRing } from "@/components/lessons/progress-ring";
import { DifficultyBadge } from "@/components/lessons/badges";

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
  const reduce = useReducedMotion();

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

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">Quiz scorecard</DialogTitle>
        <div className="flex flex-col items-center text-center">
          <span
            className="text-label mb-4 rounded-full px-2.5 py-1"
            style={{
              color: result.passed
                ? "var(--color-status-complete)"
                : "var(--color-status-overdue)",
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
              size={116}
              stroke={7}
              showLabel={false}
              color={
                result.passed ? "var(--color-status-complete)" : "var(--color-status-overdue)"
              }
            />
            <span className="tnum absolute text-2xl font-[590]">{shown}%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Pass mark {result.passMarkPct}% · {result.totalQuestions} questions
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <div className="text-label grid grid-cols-5 border-b border-border bg-muted px-3 py-2 text-muted-foreground">
            <span className="col-span-2">Difficulty</span>
            <span className="text-right">Right</span>
            <span className="text-right">Wrong</span>
            <span className="text-right">Skipped</span>
          </div>
          {result.breakup.map((b, i) => (
            <motion.div
              key={b.difficulty}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.05, duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
              className="tnum grid grid-cols-5 items-center border-b border-border px-3 py-2.5 text-sm last:border-0"
            >
              <span className="col-span-2 flex items-center gap-2">
                <DifficultyBadge difficulty={b.difficulty} />
                <span className="text-xs text-muted-foreground">{b.total}</span>
              </span>
              <span className="text-right">{b.right}</span>
              <span className="text-right">{b.wrong}</span>
              <span className="text-right">{b.unanswered}</span>
            </motion.div>
          ))}
        </div>

        <Button className="mt-4 w-full" onClick={onDone}>
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
