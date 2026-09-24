import { Check, Plus, Trash2, X } from "lucide-react";

import type { BuilderQuestion, Difficulty, QuestionKind } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;

export function makeBlankQuestion(): BuilderQuestion {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    prompt: "",
    difficulty: "medium",
    kind: "single",
    options: ["", ""],
    correctIndex: 0,
    correctIndices: [],
    explanation: "",
  };
}

const KIND_LABEL: Record<QuestionKind, string> = {
  single: "Single choice",
  multi: "Multiple choice",
  true_false: "True / False",
};

/**
 * Full editor for a single question. The type selector switches between
 * single-choice (radio), multiple-choice (checkboxes) and True/False (a fixed
 * two-option radio). Reused in the quiz editor and video-section questions.
 */
export function QuestionEditor({
  question: q,
  index,
  onChange,
  onDelete,
}: {
  question: BuilderQuestion;
  index?: number;
  onChange: (next: BuilderQuestion) => void;
  onDelete?: () => void;
}) {
  const kind: QuestionKind = q.kind ?? "single";
  const multiCorrect = q.correctIndices ?? [];
  const locked = kind === "true_false"; // options are fixed True/False

  const patch = (p: Partial<BuilderQuestion>) => onChange({ ...q, ...p });

  const changeKind = (next: QuestionKind) => {
    if (next === "true_false") {
      patch({
        kind: next,
        options: ["True", "False"],
        correctIndex: q.correctIndex === 1 ? 1 : 0,
      });
    } else if (next === "multi") {
      patch({
        kind: next,
        correctIndices: multiCorrect.length ? multiCorrect : [q.correctIndex ?? 0],
      });
    } else {
      // single
      patch({ kind: next, correctIndex: q.correctIndex ?? 0 });
    }
  };

  const setOption = (i: number, value: string) =>
    patch({ options: q.options.map((o, oi) => (oi === i ? value : o)) });

  const addOption = () => {
    if (locked || q.options.length >= MAX_OPTIONS) return;
    patch({ options: [...q.options, ""] });
  };

  const removeOption = (i: number) => {
    if (locked || q.options.length <= MIN_OPTIONS) return;
    const options = q.options.filter((_, oi) => oi !== i);
    let correctIndex = q.correctIndex;
    if (i === q.correctIndex) correctIndex = 0;
    else if (i < q.correctIndex) correctIndex -= 1;
    const correctIndices = multiCorrect
      .filter((ci) => ci !== i)
      .map((ci) => (ci > i ? ci - 1 : ci));
    patch({ options, correctIndex, correctIndices });
  };

  const toggleMulti = (i: number) => {
    const has = multiCorrect.includes(i);
    const next = has ? multiCorrect.filter((ci) => ci !== i) : [...multiCorrect, i];
    patch({ correctIndices: next.sort((a, b) => a - b) });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <Label className="text-sm font-[590]">
          {typeof index === "number" ? `Question ${index + 1}` : "Question"}
        </Label>
        <div className="flex items-center gap-2">
          <Select value={q.difficulty} onValueChange={(v) => patch({ difficulty: v as Difficulty })}>
            <SelectTrigger className="h-8 w-[104px]" aria-label="Difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              onClick={onDelete}
              aria-label="Delete question"
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
            </Button>
          )}
        </div>
      </div>

      <Textarea
        className="mt-2.5"
        rows={2}
        placeholder="Type the question…"
        value={q.prompt}
        onChange={(e) => patch({ prompt: e.target.value })}
      />

      {/* Question type */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Label className="text-xs text-muted-foreground">Type</Label>
        <Select value={kind} onValueChange={(v) => changeKind(v as QuestionKind)}>
          <SelectTrigger className="h-8 w-[168px]" aria-label="Question type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">{KIND_LABEL.single}</SelectItem>
            <SelectItem value="multi">{KIND_LABEL.multi}</SelectItem>
            <SelectItem value="true_false">{KIND_LABEL.true_false}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 grid gap-2">
        <p className="text-xs text-muted-foreground">
          {kind === "multi"
            ? "Tick every correct answer."
            : "Select the correct answer."}
        </p>
        {q.options.map((opt, i) => {
          const correct = kind === "multi" ? multiCorrect.includes(i) : i === q.correctIndex;
          return (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (kind === "multi" ? toggleMulti(i) : patch({ correctIndex: i }))}
                aria-label={`Mark option ${String.fromCharCode(65 + i)} correct`}
                aria-pressed={correct}
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center border text-[11px] font-[590] transition-colors",
                  // square for multi (checkbox), circle for single/true_false (radio)
                  kind === "multi" ? "rounded-[5px]" : "rounded-full",
                  correct
                    ? "border-status-complete bg-status-complete text-white"
                    : "border-border text-muted-foreground hover:border-status-complete/50",
                )}
              >
                {correct ? (
                  <Check className="size-3.5" strokeWidth={2.5} />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </button>
              {locked ? (
                <div className="flex h-9 flex-1 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm">
                  {opt}
                </div>
              ) : (
                <Input
                  value={opt}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  onChange={(e) => setOption(i, e.target.value)}
                  className={cn("h-9", correct && "border-status-complete/50")}
                />
              )}
              {!locked && q.options.length > MIN_OPTIONS && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground"
                  onClick={() => removeOption(i)}
                  aria-label={`Remove option ${String.fromCharCode(65 + i)}`}
                >
                  <X className="size-4" strokeWidth={1.75} />
                </Button>
              )}
            </div>
          );
        })}
        {!locked && q.options.length < MAX_OPTIONS && (
          <Button variant="ghost" size="sm" className="w-fit gap-1.5 text-primary" onClick={addOption}>
            <Plus className="size-4" strokeWidth={2} />
            Add choice
          </Button>
        )}
      </div>

      <div className="mt-3 grid gap-1.5">
        <Label htmlFor={`ex-${q.id}`} className="text-xs text-muted-foreground">
          Explanation (shown after answering — optional)
        </Label>
        <Input
          id={`ex-${q.id}`}
          value={q.explanation}
          placeholder="Why this answer is correct…"
          onChange={(e) => patch({ explanation: e.target.value })}
        />
      </div>
    </div>
  );
}
