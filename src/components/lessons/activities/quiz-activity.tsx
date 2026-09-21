import { useEffect, useMemo, useState } from "react";
import { ListChecks, Play, Timer } from "lucide-react";

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

  const [started, setStarted] = useState(false);
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

  // The timer only runs once the learner has started — never on mount.
  useEffect(() => {
    if (!started || result) return;
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
  }, [started, result]);

  // Start screen — the quiz waits for the learner before the clock begins.
  if (!started) {
    return (
      <div className="surface blue-wash animate-soft-in flex flex-col items-center gap-4 px-6 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ListChecks className="size-6" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-card-title">{activity.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            When you start, the timer begins and you can't pause it. Give yourself a clear run.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="chip-blue rounded-full px-2.5 py-1">
            {questions.length} question{questions.length === 1 ? "" : "s"}
          </span>
          <span className="chip-blue inline-flex items-center gap-1.5 rounded-full px-2.5 py-1">
            <Timer className="size-3.5" strokeWidth={1.75} />
            {activity.timeLimitMins} min
          </span>
          {activity.mandatory && (
            <span className="rounded-full bg-status-mandatory/10 px-2.5 py-1 text-status-mandatory">
              Compliance-tracked
            </span>
          )}
        </div>
        <Button className="mt-1" onClick={() => setStarted(true)}>
          <Play className="size-4" strokeWidth={2} />
          Start quiz
        </Button>
      </div>
    );
  }

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
