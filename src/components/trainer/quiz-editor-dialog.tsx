import { useEffect, useRef, useState } from "react";
import { Download, FileQuestion, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import type { BuilderQuestion } from "@/data/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/lessons/empty-state";
import { QuestionEditor, makeBlankQuestion } from "@/components/trainer/question-editor";
import { downloadQuizTemplate, parseQuizTemplateCsv } from "@/lib/quiz-template";

/**
 * Full-view quiz editor. Whether the trainer starts from a template, an Excel
 * import or a blank slate, the questions open here and every one is editable —
 * prompt, options, correct answer, difficulty and explanation.
 */
export function QuizEditorDialog({
  open,
  onOpenChange,
  quizName,
  initialQuestions,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizName: string;
  initialQuestions: BuilderQuestion[];
  onSave: (questions: BuilderQuestion[]) => void;
}) {
  const [questions, setQuestions] = useState<BuilderQuestion[]>(initialQuestions);
  const importRef = useRef<HTMLInputElement>(null);

  // Reset the working copy each time the editor is opened.
  useEffect(() => {
    if (open) setQuestions(initialQuestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setQuestion = (id: string, next: BuilderQuestion) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? next : q)));

  const addQuestion = () => setQuestions((qs) => [...qs, makeBlankQuestion()]);

  const deleteQuestion = (id: string) =>
    setQuestions((qs) => qs.filter((q) => q.id !== id));

  const handleImport = async (file: File) => {
    const isCsv = /\.csv$/i.test(file.name);
    if (!isCsv) {
      toast.info("Save the sheet as .csv to import — .xlsx parsing runs on the backend.");
      return;
    }
    const text = await file.text();
    const parsed = parseQuizTemplateCsv(text);
    if (parsed.length === 0) {
      toast.error("No questions found — check the sheet matches the template columns.");
      return;
    }
    setQuestions((qs) => [...qs, ...parsed]);
    toast.success(`Imported ${parsed.length} question${parsed.length === 1 ? "" : "s"}`);
  };

  const save = () => {
    const clean = questions.filter((q) => q.prompt.trim().length > 0);
    onSave(clean);
    onOpenChange(false);
    toast.success(`Saved ${clean.length} question${clean.length === 1 ? "" : "s"}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-0 p-0">
        <DialogHeader className="border-b border-border p-4 sm:p-5">
          <DialogTitle>Edit quiz — {quizName}</DialogTitle>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => importRef.current?.click()}>
              <Upload className="size-4" strokeWidth={1.75} />
              Import (CSV)
            </Button>
            <Button size="sm" variant="ghost" onClick={downloadQuizTemplate}>
              <Download className="size-4" strokeWidth={1.75} />
              Template
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              {questions.length} question{questions.length === 1 ? "" : "s"}
            </span>
            <input
              ref={importRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImport(file);
                e.target.value = "";
              }}
            />
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {questions.length === 0 ? (
            <EmptyState
              icon={FileQuestion}
              title="No questions yet"
              description="Add a question, or import a CSV that matches the template."
            />
          ) : (
            <div className="grid gap-3">
              {questions.map((q, i) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  index={i}
                  onChange={(next) => setQuestion(q.id, next)}
                  onDelete={() => deleteQuestion(q.id)}
                />
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5" onClick={addQuestion}>
            <Plus className="size-4" strokeWidth={2} />
            Add question
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4 sm:p-5">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={save}>
            Save questions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
