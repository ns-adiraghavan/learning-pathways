import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronRight,
  Download,
  Eye,
  FileText,
  GripVertical,
  Link2,
  ListChecks,
  Plus,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

import { toast } from "sonner";

import type {
  ActivityType,
  BuilderQuestion,
  DraftActivity,
  ModuleDraft,
  QuizTemplate,
} from "@/data/types";
import {
  getCertificateTemplates,
  getFeedbackSurveys,
  getQuizTemplates,
  getTemplateQuestions,
  setQuizMandatory,
} from "@/data/repositories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EmptyState } from "@/components/lessons/empty-state";
import { CoverPicker } from "@/components/trainer/cover-picker";
import { downloadQuizTemplate, QUIZ_TEMPLATE_COLUMNS } from "@/lib/quiz-template";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ACTIVITY_ICON: Record<ActivityType, typeof Video> = {
  video: Video,
  deck: FileText,
  weblink: Link2,
  quiz: ListChecks,
};

const NEW_ACTIVITY_META: Record<ActivityType, string> = {
  video: "0 min",
  deck: "0 pages",
  weblink: "External link",
  quiz: "From template",
};

export function ContentFlowTab({
  draft,
  onChange,
}: {
  draft: ModuleDraft;
  onChange: (next: ModuleDraft) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { data: quizTemplates = [] } = useQuery({
    queryKey: ["quiz-templates"],
    queryFn: getQuizTemplates,
  });
  const { data: certTemplates = [] } = useQuery({
    queryKey: ["certificate-templates"],
    queryFn: getCertificateTemplates,
  });
  const { data: surveys = [] } = useQuery({
    queryKey: ["feedback-surveys"],
    queryFn: getFeedbackSurveys,
  });

  const setActivities = (activities: DraftActivity[]) => onChange({ ...draft, activities });

  const patchActivity = (id: string, patch: Partial<DraftActivity>) =>
    setActivities(draft.activities.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const move = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const list = [...draft.activities];
    const from = list.findIndex((a) => a.id === fromId);
    const to = list.findIndex((a) => a.id === toId);
    if (from < 0 || to < 0) return;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item!);
    setActivities(list);
  };

  const addActivity = (type: ActivityType) => {
    const id = `new-${Date.now()}`;
    setActivities([
      ...draft.activities,
      {
        id,
        name: `New ${type}`,
        type,
        meta: NEW_ACTIVITY_META[type],
        required: true,
        draft: true,
        mandatory: false,
        ...(type === "quiz"
          ? {
              completionCriteria: "pass" as const,
              passingPct: 70,
              timeLimitMins: 15,
              maxReattempts: 2,
              shuffle: true,
            }
          : {}),
      },
    ]);
    // Open the new activity so its setup is immediately editable.
    setExpanded((prev) => new Set(prev).add(id));
  };

  const selectedCert = certTemplates.find((c) => c.id === draft.certificateTemplateId);

  return (
    <div className="grid gap-6">
      <section className="surface p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="title">Module title</Label>
              <Input
                id="title"
                value={draft.title}
                onChange={(e) => onChange({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={draft.description}
                onChange={(e) => onChange({ ...draft, description: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Cover image</Label>
            <div className="overflow-hidden rounded-lg border border-border">
              <img
                src={draft.posterImage}
                alt="Module cover"
                className="aspect-video w-full object-cover"
              />
            </div>
            <CoverPicker
              value={draft.posterImage}
              onSelect={(dataUri) => onChange({ ...draft, posterImage: dataUri })}
            />
          </div>
        </div>
      </section>

      <section className="surface p-4 sm:p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h2 className="text-card-title">Activities</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Drag to reorder. Learners see this sequence.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Select onValueChange={(v) => addActivity(v as ActivityType)}>
              <SelectTrigger className="h-9 w-[150px]" aria-label="Add activity">
                <span className="flex items-center gap-1.5">
                  <Plus className="size-4" strokeWidth={2} />
                  Add activity
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="deck">Deck</SelectItem>
                <SelectItem value="weblink">Web link</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              Import activities
            </Button>
          </div>
        </div>

        <div className="mt-4">
          {draft.activities.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No activities yet"
              description="Add a video, deck, link or quiz to build this module's flow."
            />
          ) : (
            <ul className="grid gap-2">
              {draft.activities.map((a, i) => {
                const Icon = ACTIVITY_ICON[a.type];
                const open = expanded.has(a.id);
                return (
                  <li
                    key={a.id}
                    draggable
                    onDragStart={() => setDragId(a.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragId) move(dragId, a.id);
                      setDragId(null);
                    }}
                    className={cn(
                      "overflow-hidden rounded-lg border border-border bg-card",
                      dragId === a.id && "opacity-60",
                    )}
                  >
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <GripVertical className="size-4 cursor-grab" strokeWidth={1.75} />
                        <span className="tnum w-4 text-xs">{i + 1}</span>
                        <Icon className="size-4" strokeWidth={1.75} />
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(a.id)}
                        className="min-w-0 text-left"
                        aria-expanded={open}
                      >
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-[510]">{a.name}</span>
                          {a.type === "quiz" && a.mandatory && (
                            <span className="shrink-0 rounded-[4px] bg-cat-mandatory/12 px-1.5 py-0.5 text-[10px] font-[590] text-cat-mandatory">
                              Mandatory
                            </span>
                          )}
                          {a.draft && (
                            <span className="shrink-0 rounded-[4px] border border-border px-1.5 py-0.5 text-[10px] font-[510] text-muted-foreground">
                              Draft
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          <span className="capitalize">{a.type}</span> · {a.meta}
                          {a.type === "quiz" &&
                            ` · ${
                              (a.completionCriteria ?? "pass") === "pass"
                                ? `pass ≥ ${a.passingPct ?? 70}%`
                                : "completion only"
                            }`}
                        </span>
                      </button>
                      <span className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                          onClick={() => toggleExpanded(a.id)}
                          aria-label={`${open ? "Collapse" : "Set up"} ${a.name}`}
                        >
                          {a.type === "quiz" ? "Set up" : "Edit"}
                          <ChevronRight
                            className={cn("size-4 transition-transform", open && "rotate-90")}
                            strokeWidth={1.75}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${a.name}`}
                          onClick={() => {
                            setActivities(draft.activities.filter((x) => x.id !== a.id));
                            setExpanded((prev) => {
                              const next = new Set(prev);
                              next.delete(a.id);
                              return next;
                            });
                          }}
                        >
                          <Trash2 className="size-4" strokeWidth={1.75} />
                        </Button>
                      </span>
                    </div>

                    {open && (
                      <ActivityPanel
                        activity={a}
                        quizTemplates={quizTemplates}
                        onPatch={(patch) => patchActivity(a.id, patch)}
                        onToggleMandatory={(v) => {
                          patchActivity(a.id, { mandatory: v });
                          void setQuizMandatory(a.id, v).then(() =>
                            toast.success(v ? "Quiz marked mandatory" : "Quiz no longer mandatory"),
                          );
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-[510]">Learner must follow order</p>
            <p className="text-xs text-muted-foreground">
              {draft.orderLocked
                ? "Steps unlock one after another."
                : "Learners can take activities in any order."}
            </p>
          </div>
          <Switch
            checked={draft.orderLocked}
            onCheckedChange={(v) => onChange({ ...draft, orderLocked: v })}
            aria-label="Learner must follow order"
          />
        </div>

        {/* Module-level completion — captured separately from each quiz's own criteria */}
        <div className="mt-3 rounded-lg border border-border px-3 py-3">
          <p className="text-sm font-[510]">Module counts as complete when</p>
          <RadioGroup
            className="mt-2.5 grid gap-2 sm:grid-cols-2"
            value={draft.settings.completionRule}
            onValueChange={(v) =>
              onChange({
                ...draft,
                settings: {
                  ...draft.settings,
                  completionRule: v as ModuleDraft["settings"]["completionRule"],
                },
              })
            }
          >
            <label
              htmlFor="mr-activities"
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm",
                draft.settings.completionRule === "complete-activities"
                  ? "border-primary bg-primary/5"
                  : "border-border",
              )}
            >
              <RadioGroupItem value="complete-activities" id="mr-activities" className="mt-0.5" />
              <span>
                <span className="block font-[510]">All required activities done</span>
                <span className="block text-xs text-muted-foreground">
                  Finishing every required activity completes the module.
                </span>
              </span>
            </label>
            <label
              htmlFor="mr-pass"
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm",
                draft.settings.completionRule === "pass-quizzes"
                  ? "border-primary bg-primary/5"
                  : "border-border",
              )}
            >
              <RadioGroupItem value="pass-quizzes" id="mr-pass" className="mt-0.5" />
              <span>
                <span className="block font-[510]">…and all pass-criteria quizzes passed</span>
                <span className="block text-xs text-muted-foreground">
                  Quizzes set to “Must pass” have to be cleared too.
                </span>
              </span>
            </label>
          </RadioGroup>
        </div>
      </section>

      <section className="surface p-4 sm:p-5">
        <h2 className="text-card-title">On completion</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Certificates and surveys are pre-built assets — pick one, no design work needed.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Certificate template</Label>
            <div className="flex gap-2">
              <Select
                value={draft.certificateTemplateId ?? "none"}
                onValueChange={(v) =>
                  onChange({ ...draft, certificateTemplateId: v === "none" ? null : v })
                }
              >
                <SelectTrigger className="h-9 flex-1">
                  <SelectValue placeholder="Pick a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No certificate</SelectItem>
                  {certTemplates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!selectedCert}>
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{selectedCert?.name ?? "Certificate"}</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">{selectedCert?.description}</p>
                  <div
                    className={cn(
                      "mt-2 flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center",
                      selectedCert?.orientation === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]",
                    )}
                  >
                    <p className="text-label text-muted-foreground">Certificate of completion</p>
                    <p className="mt-3 text-card-title">{draft.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Learner name</p>
                    <span
                      className="mt-5 block h-0.5 w-24 rounded-full"
                      style={{ background: selectedCert?.accent }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Feedback survey (optional)</Label>
            <Select
              value={draft.feedbackSurveyId ?? "none"}
              onValueChange={(v) =>
                onChange({ ...draft, feedbackSurveyId: v === "none" ? null : v })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="No survey" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No survey</SelectItem>
                {surveys.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.questionCount} questions
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Inline editor for a single activity — rich quiz setup, light for other types. */
function ActivityPanel({
  activity: a,
  quizTemplates,
  onPatch,
  onToggleMandatory,
}: {
  activity: DraftActivity;
  quizTemplates: QuizTemplate[];
  onPatch: (patch: Partial<DraftActivity>) => void;
  onToggleMandatory: (value: boolean) => void;
}) {
  const template = quizTemplates.find((t) => t.id === a.templateId);
  const criteria = a.completionCriteria ?? "pass";
  const templateInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="grid gap-4 border-t border-border bg-secondary/30 p-3 sm:p-4">
      <div className="grid gap-1.5">
        <Label htmlFor={`name-${a.id}`}>Name</Label>
        <Input
          id={`name-${a.id}`}
          value={a.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
      </div>

      {a.type === "quiz" ? (
        <>
          {/* Question source — built here, under the module, not in a separate builder */}
          <div className="grid gap-1.5">
            <Label>Questions</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={a.templateId || "none"}
                onValueChange={(v) =>
                  onPatch({
                    templateId: v === "none" ? "" : v,
                    meta:
                      v === "none"
                        ? a.meta
                        : `${quizTemplates.find((t) => t.id === v)?.questionCount ?? 10} questions · ${
                            a.timeLimitMins ?? 15
                          } min`,
                  })
                }
              >
                <SelectTrigger className="h-9 w-full sm:w-64" aria-label="Question template">
                  <SelectValue placeholder="Pick a question template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template yet</SelectItem>
                  {quizTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {t.questionCount} Qs
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => templateInputRef.current?.click()}
              >
                <Upload className="size-4" strokeWidth={1.75} />
                Upload Excel
              </Button>
              <input
                ref={templateInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onPatch({ meta: `Imported from ${file.name}` });
                    toast.success(`Imported “${file.name}” — questions loaded`);
                  }
                  e.target.value = "";
                }}
              />
            </div>
            {/* The template a trainer fills in and uploads — always one click away. */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                Need the format? Columns:{" "}
                <span className="font-[510] text-foreground">
                  {QUIZ_TEMPLATE_COLUMNS.slice(0, 2).join(", ")}, …
                </span>
              </span>
              <button
                type="button"
                onClick={downloadQuizTemplate}
                className="inline-flex items-center gap-1 text-xs font-[510] text-primary hover:underline"
              >
                <Download className="size-3.5" strokeWidth={1.75} />
                Download Excel template
              </button>
            </div>
            {template && (
              <p className="tnum text-xs text-muted-foreground">
                {template.questionCount} questions · {template.mix.easy}E / {template.mix.medium}M /{" "}
                {template.mix.hard}H
              </p>
            )}
            {/* Preview the actual questions in-line so a trainer can see/verify them here */}
            <QuestionsPreview templateId={a.templateId} />
          </div>

          {/* Completion criteria — either finishing or passing */}
          <div className="grid gap-2">
            <Label>Completion criteria</Label>
            <RadioGroup
              className="grid gap-2 sm:grid-cols-2"
              value={criteria}
              onValueChange={(v) => onPatch({ completionCriteria: v as "completion" | "pass" })}
            >
              <label
                htmlFor={`cc-completion-${a.id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm",
                  criteria === "completion" ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <RadioGroupItem
                  value="completion"
                  id={`cc-completion-${a.id}`}
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-[510]">Completion only</span>
                  <span className="block text-xs text-muted-foreground">
                    Counts as done once attempted — no score gate.
                  </span>
                </span>
              </label>
              <label
                htmlFor={`cc-pass-${a.id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm",
                  criteria === "pass" ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <RadioGroupItem value="pass" id={`cc-pass-${a.id}`} className="mt-0.5" />
                <span>
                  <span className="block font-[510]">Must pass</span>
                  <span className="block text-xs text-muted-foreground">
                    Learner has to score at or above the pass mark.
                  </span>
                </span>
              </label>
            </RadioGroup>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {criteria === "pass" && (
              <div className="grid gap-1.5">
                <Label htmlFor={`pass-${a.id}`}>Pass mark %</Label>
                <Input
                  id={`pass-${a.id}`}
                  type="number"
                  min={0}
                  max={100}
                  className="tnum"
                  value={a.passingPct ?? 70}
                  onChange={(e) => onPatch({ passingPct: Number(e.target.value) })}
                />
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor={`time-${a.id}`}>Time limit (min)</Label>
              <Input
                id={`time-${a.id}`}
                type="number"
                min={1}
                className="tnum"
                value={a.timeLimitMins ?? 15}
                onChange={(e) => onPatch({ timeLimitMins: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`retry-${a.id}`}>Max reattempts</Label>
              <Input
                id={`retry-${a.id}`}
                type="number"
                min={0}
                className="tnum"
                value={a.maxReattempts ?? 2}
                onChange={(e) => onPatch({ maxReattempts: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end justify-between gap-2 rounded-lg border border-border px-3 py-2 sm:flex-col sm:items-start sm:justify-center">
              <Label htmlFor={`shuffle-${a.id}`} className="text-xs text-muted-foreground">
                Shuffle
              </Label>
              <Switch
                id={`shuffle-${a.id}`}
                checked={a.shuffle ?? true}
                onCheckedChange={(v) => onPatch({ shuffle: v })}
              />
            </div>
          </div>
        </>
      ) : null}

      {/* Shared toggles */}
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
          <span className="text-muted-foreground">Required to finish</span>
          <Switch checked={a.required} onCheckedChange={(v) => onPatch({ required: v })} />
        </label>
        <label className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
          <span className="text-muted-foreground">Keep as draft</span>
          <Switch checked={a.draft} onCheckedChange={(v) => onPatch({ draft: v })} />
        </label>
        {a.type === "quiz" && (
          <label className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <span className="text-muted-foreground" title="Compliance-tracked across the org">
              Mandatory (compliance)
            </span>
            <Switch checked={a.mandatory} onCheckedChange={onToggleMandatory} />
          </label>
        )}
      </div>
    </div>
  );
}

const DIFF_BADGE: Record<BuilderQuestion["difficulty"], string> = {
  easy: "bg-status-complete/12 text-status-complete",
  medium: "bg-cat-bank/15 text-cat-bank",
  hard: "bg-status-overdue/12 text-status-overdue",
};

/**
 * In-line question preview for the trainer. Shows the actual questions loaded for
 * this quiz — prompt, options (correct one marked) and explanation — so a trainer
 * can see and verify the assessment right in the module editor.
 */
function QuestionsPreview({ templateId }: { templateId?: string | undefined }) {
  const [open, setOpen] = useState(false);
  const { data: questions = [], isPending } = useQuery({
    queryKey: ["template-questions", templateId],
    queryFn: () => getTemplateQuestions(templateId!),
    enabled: open && !!templateId,
  });

  if (!templateId) {
    return (
      <p className="text-xs text-muted-foreground">
        Pick a template or upload a sheet to preview its questions here.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
      >
        <Eye className="size-4 text-muted-foreground" strokeWidth={1.75} />
        <span className="font-[510]">Preview questions</span>
        <ChevronRight
          className={cn(
            "ml-auto size-4 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
          strokeWidth={1.75}
        />
      </button>
      {open && (
        <div className="border-t border-border p-3">
          {isPending ? (
            <p className="text-xs text-muted-foreground">Loading questions…</p>
          ) : questions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No questions found for this template.</p>
          ) : (
            <ol className="grid gap-3">
              {questions.map((q, i) => (
                <li key={q.id} className="rounded-lg bg-secondary/40 p-3">
                  <div className="flex items-start gap-2">
                    <span className="tnum mt-0.5 text-xs font-[590] text-muted-foreground">
                      {i + 1}.
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-[510]">{q.prompt}</p>
                        <span
                          className={cn(
                            "shrink-0 rounded-[4px] px-1.5 py-0.5 text-[10px] font-[590] capitalize",
                            DIFF_BADGE[q.difficulty],
                          )}
                        >
                          {q.difficulty}
                        </span>
                      </div>
                      <ul className="mt-2 grid gap-1">
                        {q.options.map((opt, oi) => {
                          const correct = oi === q.correctIndex;
                          return (
                            <li
                              key={oi}
                              className={cn(
                                "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm",
                                correct
                                  ? "border-status-complete/40 bg-status-complete/8 text-foreground"
                                  : "border-border text-muted-foreground",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-[590]",
                                  correct
                                    ? "bg-status-complete text-white"
                                    : "bg-secondary text-muted-foreground",
                                )}
                              >
                                {correct ? (
                                  <Check className="size-3" strokeWidth={2.5} />
                                ) : (
                                  String.fromCharCode(65 + oi)
                                )}
                              </span>
                              {opt}
                            </li>
                          );
                        })}
                      </ul>
                      {q.explanation && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          <span className="font-[510] text-foreground">Why:</span> {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
