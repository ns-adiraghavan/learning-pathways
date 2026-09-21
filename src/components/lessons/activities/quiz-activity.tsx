import { useEffect, useMemo, useState } from "react";
import { Timer } from "lucide-react";

import type { QuizActivity as QuizActivityType, QuizResult } from "@/data/types";
import { submitQuiz } from "@/data/repositories";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScorecardDialog } from "./scorecard-dialog";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function QuizActivity({
  activity,
  onComplete,
}: {
  activity: QuizActivityType;
  onComplete: () => void;
}) {
  const questions = useMemo(
    () => (activity.shuffle ? shuffled(activity.questions) : activity.questions),
    [activity],
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [seconds, setSeconds] = useState(activity.timeLimitMins * 60);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const question = questions[index];

  const last = index === questions.length - 1;

  async function handleSubmit() {
    setSubmitting(true);
    const res = await submitQuiz(activity.id, answers);
    setResult(res);
    setSubmitting(false);
  }

  useEffect(() => {
    if (result) return;
    const id = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          void handleSubmit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!question) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="tnum text-sm text-muted-foreground">
          Question {index + 1} of {questions.length}
        </p>
        <span
          className={cn(
            "tnum inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-sm",
            seconds <= 30 && "text-status-overdue",
          )}
        >
          <Timer className="size-3.5" strokeWidth={1.75} />
          {formatClock(seconds)}
        </span>
      </div>

      <Progress value={((index + 1) / questions.length) * 100} className="h-1.5" />

      <div key={question.id} className="animate-step-in space-y-4">
        <h2 className="text-lg font-[510]">{question.prompt}</h2>

        <div className="space-y-2">
          {question.options.map((opt) => {
            const selected = answers[question.id] === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [question.id]: opt.id }))}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "size-3.5 shrink-0 rounded-full border",
                    selected ? "border-primary bg-primary" : "border-border",
                  )}
                />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          Back
        </Button>
        {last ? (
          <Button onClick={handleSubmit} disabled={submitting}>
            Submit
          </Button>
        ) : (
          <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
        )}
      </div>

      <ScorecardDialog
        result={result}
        open={Boolean(result)}
        onDone={() => {
          setResult(null);
          onComplete();
        }}
      />
    </div>
  );
}
