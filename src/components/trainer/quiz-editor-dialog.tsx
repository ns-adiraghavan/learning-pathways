import { useEffect, useRef, useState } from "react";
import { Clapperboard, Clock, Download, ListChecks, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import type { QuizSection, SectionTiming } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionEditor, makeBlankQuestion } from "@/components/trainer/question-editor";
import { downloadQuizTemplate, parseQuizTemplateCsv } from "@/lib/quiz-template";
import { parseClock, toClock } from "@/lib/video-source";
import { cn } from "@/lib/utils";

let sectionSeq = 0;
export function makeSection(title = "New section"): QuizSection {
  sectionSeq += 1;
  return {
    id: `sec-${Date.now()}-${sectionSeq}`,
    title,
    timing: "quiz",
    atSeconds: null,
    questions: [makeBlankQuestion()],
  };
}

const TIMING_OPTIONS: { value: SectionTiming; label: string; icon: typeof ListChecks }[] = [
  { value: "quiz", label: "Part of quiz", icon: ListChecks },
  { value: "video-point", label: "At a video point", icon: Clock },
  { value: "video-end", label: "At video end", icon: Clapperboard },
];

/** Short chip label for a section's timing, e.g. "Quiz", "@2:30", "End". */
function timingChip(s: QuizSection): string {
  if (s.timing === "video-point") return `@${toClock(s.atSeconds ?? 0)}`;
  if (s.timing === "video-end") return "End";
  return "Quiz";
}

/**
 * Full-view quiz editor, organised into sections (like the previous platform).
 * Each section holds its own questions and a timing: part of the quiz, popped
 * at a point in the video, or at the video's end. Import / template land into
 * the selected section, and every question stays individually editable.
 */
export function QuizEditorDialog({
  open,
  onOpenChange,
  quizName,
  initialSections,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizName: string;
  initialSections: QuizSection[];
  onSave: (sections: QuizSection[]) => void;
}) {
  const [sections, setSections] = useState<QuizSection[]>(initialSections);
  const [selectedId, setSelectedId] = useState<string | null>(initialSections[0]?.id ?? null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSections(initialSections);
      setSelectedId(initialSections[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selected = sections.find((s) => s.id === selectedId) ?? null;

  const patchSection = (id: string, patch: Partial<QuizSection>) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addSection = () => {
    const s = makeSection(`Section ${sections.length + 1}`);
    setSections((prev) => [...prev, s]);
    setSelectedId(s.id);
  };

  const deleteSection = (id: string) =>
    setSections((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });

  const setQuestions = (id: string, questions: QuizSection["questions"]) =>
    patchSection(id, { questions });

  const handleImport = async (file: File) => {
    if (!selected) return;
    if (!/\.csv$/i.test(file.name)) {
      toast.info("Save the sheet as .csv to import — .xlsx parsing runs on the backend.");
      return;
    }
    const parsed = parseQuizTemplateCsv(await file.text());
    if (parsed.length === 0) {
      toast.error("No questions found — check the sheet matches the template columns.");
      return;
    }
    setQuestions(selected.id, [...selected.questions, ...parsed]);
    toast.success(`Imported ${parsed.length} into “${selected.title}”`);
  };

  const save = () => {
    const clean = sections
      .map((s) => ({ ...s, questions: s.questions.filter((q) => q.prompt.trim().length > 0) }))
      .filter((s) => s.questions.length > 0);
    onSave(clean);
    onOpenChange(false);
    const total = clean.reduce((n, s) => n + s.questions.length, 0);
    toast.success(`Saved ${clean.length} section${clean.length === 1 ? "" : "s"} · ${total} questions`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] w-full max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="border-b border-border p-4 sm:p-5">
          <DialogTitle>Edit quiz — {quizName}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Group questions into sections. A section can be part of the quiz, or set to pop at a
            point in the video or at its end.
          </p>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-[220px_minmax(0,1fr)]">
          {/* Sections rail */}
          <aside className="flex min-h-0 flex-col border-b border-border sm:border-b-0 sm:border-r">
            <div className="flex items-center justify-between gap-2 p-3">
              <span className="text-label text-muted-foreground">Sections</span>
              <Button size="sm" variant="outline" className="h-8 gap-1" onClick={addSection}>
                <Plus className="size-4" strokeWidth={2} />
                Add
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {sections.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  No sections yet. Add one to start.
                </p>
              ) : (
                <ul className="grid gap-1">
                  {sections.map((s) => {
                    const active = s.id === selectedId;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className={cn(
                            "group flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
                            active
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:bg-secondary/60",
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-[510]">{s.title}</span>
                            <span className="tnum block text-xs text-muted-foreground">
                              {s.questions.length} Q · {timingChip(s)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* Selected section */}
          <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
            {!selected ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Pick a section on the left, or add one to begin.
                </p>
                <Button size="sm" onClick={addSection}>
                  <Plus className="size-4" strokeWidth={2} />
                  Add section
                </Button>
              </div>
            ) : (
              <SectionEditor
                key={selected.id}
                section={selected}
                onPatch={(patch) => patchSection(selected.id, patch)}
                onDelete={() => deleteSection(selected.id)}
                onImportClick={() => importRef.current?.click()}
              />
            )}
          </div>
        </div>

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

        <div className="flex items-center justify-end gap-2 border-t border-border p-4 sm:p-5">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={save}>
            Save quiz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionEditor({
  section: s,
  onPatch,
  onDelete,
  onImportClick,
}: {
  section: QuizSection;
  onPatch: (patch: Partial<QuizSection>) => void;
  onDelete: () => void;
  onImportClick: () => void;
}) {
  const setQuestion = (id: string, next: QuizSection["questions"][number]) =>
    onPatch({ questions: s.questions.map((q) => (q.id === id ? next : q)) });

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        <Input
          value={s.title}
          placeholder="Section title"
          onChange={(e) => onPatch({ title: e.target.value })}
          className="font-[510]"
        />
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-muted-foreground"
          onClick={onDelete}
          aria-label="Delete section"
        >
          <Trash2 className="size-4" strokeWidth={1.75} />
        </Button>
      </div>

      {/* Timing — this is the video sectioning control */}
      <div className="grid gap-2 rounded-lg border border-border p-3">
        <p className="text-sm font-[510]">When does this section show?</p>
        <div className="flex flex-wrap gap-2">
          {TIMING_OPTIONS.map((t) => {
            const active = s.timing === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() =>
                  onPatch({
                    timing: t.value,
                    atSeconds: t.value === "video-point" ? (s.atSeconds ?? 60) : null,
                  })
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                <t.icon className="size-4" strokeWidth={1.75} />
                {t.label}
              </button>
            );
          })}
        </div>
        {s.timing === "video-point" && (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Pop at</span>
            <Input
              className="tnum h-8 w-24"
              placeholder="mm:ss"
              defaultValue={toClock(s.atSeconds ?? 0)}
              onBlur={(e) => {
                const secs = parseClock(e.target.value);
                if (secs !== null) onPatch({ atSeconds: secs });
              }}
            />
            <span className="text-xs text-muted-foreground">into the video</span>
          </div>
        )}
      </div>

      {/* Import into this section */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onImportClick}>
          <Upload className="size-4" strokeWidth={1.75} />
          Import (CSV)
        </Button>
        <button
          type="button"
          onClick={downloadQuizTemplate}
          className="inline-flex items-center gap-1 text-xs font-[510] text-primary hover:underline"
        >
          <Download className="size-3.5" strokeWidth={1.75} />
          Template
        </button>
        <span className="ml-auto text-xs text-muted-foreground">
          {s.questions.length} question{s.questions.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Questions */}
      <div className="grid gap-3">
        {s.questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={i}
            onChange={(next) => setQuestion(q.id, next)}
            onDelete={() => onPatch({ questions: s.questions.filter((x) => x.id !== q.id) })}
          />
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5"
        onClick={() => onPatch({ questions: [...s.questions, makeBlankQuestion()] })}
      >
        <Plus className="size-4" strokeWidth={2} />
        Add question
      </Button>
    </div>
  );
}
