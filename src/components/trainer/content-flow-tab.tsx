import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Clock,
  Download,
  FileText,
  GripVertical,
  HardDrive,
  Link2,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Video,
  Youtube,
} from "lucide-react";

import { toast } from "sonner";

import type {
  ActivityType,
  BuilderQuestion,
  DraftActivity,
  ModuleDraft,
  QuizTemplate,
  VideoCheckpoint,
  VideoProvider,
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
import { QuizEditorDialog } from "@/components/trainer/quiz-editor-dialog";
import { QuestionEditor, makeBlankQuestion } from "@/components/trainer/question-editor";
import { downloadQuizTemplate, parseQuizTemplateCsv } from "@/lib/quiz-template";
import { isValidVideoLink, parseClock, toClock } from "@/lib/video-source";
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
  video: "No source yet",
  deck: "No file yet",
  weblink: "External link",
  quiz: "0 questions",
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
        ...(type === "video"
          ? {
              provider: "upload" as const,
              sourceUrl: "",
              uploadName: "",
              durationMins: 0,
              enforceFocus: true,
              checkpoints: [],
            }
          : {}),
        ...(type === "deck" ? { docName: "", pages: 0 } : {}),
        ...(type === "weblink" ? { url: "" } : {}),
        ...(type === "quiz"
          ? {
              completionCriteria: "pass" as const,
              passingPct: 70,
              timeLimitMins: 15,
              maxReattempts: 2,
              shuffle: true,
              questions: [],
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
                <SelectItem value="deck">Document / slides</SelectItem>
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
              description="Add a video, document, link or quiz to build this module's flow."
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
                          <span className="capitalize">{a.type === "deck" ? "document" : a.type}</span>{" "}
                          · {a.meta}
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

/** Inline editor for a single activity — type-specific setup. */
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

      {a.type === "video" && <VideoPanel activity={a} onPatch={onPatch} />}
      {a.type === "deck" && <DeckPanel activity={a} onPatch={onPatch} />}
      {a.type === "weblink" && <WeblinkPanel activity={a} onPatch={onPatch} />}
      {a.type === "quiz" && (
        <QuizPanel activity={a} quizTemplates={quizTemplates} onPatch={onPatch} />
      )}

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

/* --------------------------------- VIDEO --------------------------------- */

const VIDEO_SOURCES: { value: VideoProvider; label: string; icon: typeof Video }[] = [
  { value: "upload", label: "Upload", icon: Upload },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "gdrive", label: "Drive", icon: HardDrive },
];

function VideoPanel({
  activity: a,
  onPatch,
}: {
  activity: DraftActivity;
  onPatch: (patch: Partial<DraftActivity>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const provider = a.provider ?? "upload";
  const checkpoints = a.checkpoints ?? [];

  const linkOk =
    provider === "upload" || !a.sourceUrl || isValidVideoLink(provider, a.sourceUrl);

  const addCheckpoint = () => {
    const cp: VideoCheckpoint = {
      id: `cp-${Date.now()}`,
      atSeconds: checkpoints.length === 0 ? 60 : null,
      question: makeBlankQuestion(),
    };
    onPatch({ checkpoints: [...checkpoints, cp] });
  };

  const patchCheckpoint = (id: string, patch: Partial<VideoCheckpoint>) =>
    onPatch({
      checkpoints: checkpoints.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });

  const removeCheckpoint = (id: string) =>
    onPatch({ checkpoints: checkpoints.filter((c) => c.id !== id) });

  return (
    <>
      <div className="grid gap-2">
        <Label>Video source</Label>
        <div className="flex flex-wrap gap-2">
          {VIDEO_SOURCES.map((s) => {
            const active = provider === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onPatch({ provider: s.value })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                <s.icon className="size-4" strokeWidth={1.75} />
                {s.label}
              </button>
            );
          })}
        </div>

        {provider === "upload" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" strokeWidth={1.75} />
              Upload video
            </Button>
            <span className="truncate text-xs text-muted-foreground">
              {a.uploadName ? a.uploadName : "MP4 / MOV / WebM"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onPatch({ uploadName: file.name, meta: file.name });
                  toast.success(`Selected “${file.name}”`);
                }
                e.target.value = "";
              }}
            />
          </div>
        ) : (
          <div className="grid gap-1">
            <Input
              value={a.sourceUrl ?? ""}
              placeholder={
                provider === "youtube"
                  ? "https://www.youtube.com/watch?v=…"
                  : "https://drive.google.com/file/d/…/view"
              }
              onChange={(e) =>
                onPatch({
                  sourceUrl: e.target.value,
                  meta: e.target.value ? `${provider === "youtube" ? "YouTube" : "Drive"} link` : a.meta,
                })
              }
              className={cn(!linkOk && "border-status-overdue")}
            />
            {!linkOk && (
              <p className="text-xs text-status-overdue">
                That doesn’t look like a {provider === "youtube" ? "YouTube" : "Google Drive"} link.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`dur-${a.id}`}>Duration (min)</Label>
          <Input
            id={`dur-${a.id}`}
            type="number"
            min={0}
            className="tnum"
            value={a.durationMins ?? 0}
            onChange={(e) => onPatch({ durationMins: Number(e.target.value) })}
          />
        </div>
        <label className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm sm:mt-6">
          <span className="text-muted-foreground">Pause if the learner switches away</span>
          <Switch
            checked={a.enforceFocus ?? true}
            onCheckedChange={(v) => onPatch({ enforceFocus: v })}
          />
        </label>
      </div>

      {/* In-video question checkpoints — section the video */}
      <div className="grid gap-2 rounded-lg border border-dashed border-border bg-secondary/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-[510]">In-video questions</p>
            <p className="text-xs text-muted-foreground">
              Pop a question at a point in the video, or at the end.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addCheckpoint}>
            <Plus className="size-4" strokeWidth={2} />
            Add
          </Button>
        </div>

        {checkpoints.length > 0 && (
          <div className="grid gap-3">
            {checkpoints.map((cp) => (
              <CheckpointRow
                key={cp.id}
                checkpoint={cp}
                onChange={(patch) => patchCheckpoint(cp.id, patch)}
                onDelete={() => removeCheckpoint(cp.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CheckpointRow({
  checkpoint: cp,
  onChange,
  onDelete,
}: {
  checkpoint: VideoCheckpoint;
  onChange: (patch: Partial<VideoCheckpoint>) => void;
  onDelete: () => void;
}) {
  const atEnd = cp.atSeconds === null;
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Clock className="size-4 text-muted-foreground" strokeWidth={1.75} />
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={atEnd}
            onCheckedChange={(v) => onChange({ atSeconds: v ? null : 60 })}
            aria-label="Ask at the end of the video"
          />
          <span className="text-muted-foreground">At the end</span>
        </label>
        {!atEnd && (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">at</span>
            <Input
              className="tnum h-8 w-20"
              placeholder="mm:ss"
              defaultValue={toClock(cp.atSeconds ?? 0)}
              onBlur={(e) => {
                const secs = parseClock(e.target.value);
                if (secs !== null) onChange({ atSeconds: secs });
              }}
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-8 text-muted-foreground"
          onClick={onDelete}
          aria-label="Remove checkpoint"
        >
          <Trash2 className="size-4" strokeWidth={1.75} />
        </Button>
      </div>
      <QuestionEditor question={cp.question} onChange={(q) => onChange({ question: q })} />
    </div>
  );
}

/* --------------------------- DOCUMENT / SLIDES --------------------------- */

function DeckPanel({
  activity: a,
  onPatch,
}: {
  activity: DraftActivity;
  onPatch: (patch: Partial<DraftActivity>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Label>Document or slides</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" strokeWidth={1.75} />
            Upload file
          </Button>
          <span className="truncate text-xs text-muted-foreground">
            {a.docName ? a.docName : "PDF · PPT / PPTX · DOC / DOCX"}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.ppt,.pptx,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onPatch({ docName: file.name, meta: file.name });
                toast.success(`Selected “${file.name}”`);
              }
              e.target.value = "";
            }}
          />
        </div>
      </div>
      <div className="grid gap-1.5 sm:w-40">
        <Label htmlFor={`pages-${a.id}`}>Pages / slides</Label>
        <Input
          id={`pages-${a.id}`}
          type="number"
          min={0}
          className="tnum"
          value={a.pages ?? 0}
          onChange={(e) => onPatch({ pages: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}

/* -------------------------------- WEB LINK ------------------------------- */

function WeblinkPanel({
  activity: a,
  onPatch,
}: {
  activity: DraftActivity;
  onPatch: (patch: Partial<DraftActivity>) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={`url-${a.id}`}>Link URL</Label>
      <Input
        id={`url-${a.id}`}
        type="url"
        placeholder="https://…"
        value={a.url ?? ""}
        onChange={(e) => onPatch({ url: e.target.value, meta: e.target.value || a.meta })}
      />
    </div>
  );
}

/* ---------------------------------- QUIZ --------------------------------- */

function QuizPanel({
  activity: a,
  quizTemplates,
  onPatch,
}: {
  activity: DraftActivity;
  quizTemplates: QuizTemplate[];
  onPatch: (patch: Partial<DraftActivity>) => void;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const questions = a.questions ?? [];
  const criteria = a.completionCriteria ?? "pass";

  const applyQuestions = (next: BuilderQuestion[]) => {
    const mins = a.timeLimitMins ?? 15;
    onPatch({
      questions: next,
      meta: `${next.length} question${next.length === 1 ? "" : "s"} · ${mins} min`,
    });
  };

  const loadTemplate = async (id: string) => {
    if (id === "none") {
      onPatch({ templateId: "" });
      return;
    }
    const loaded = await getTemplateQuestions(id);
    onPatch({
      templateId: id,
      questions: loaded,
      meta: `${loaded.length} question${loaded.length === 1 ? "" : "s"} · ${a.timeLimitMins ?? 15} min`,
    });
    toast.success(`Loaded ${loaded.length} questions — edit them any time`);
  };

  const importCsv = async (file: File) => {
    if (!/\.csv$/i.test(file.name)) {
      toast.info("Save the sheet as .csv to import — .xlsx parsing runs on the backend.");
      return;
    }
    const parsed = parseQuizTemplateCsv(await file.text());
    if (parsed.length === 0) {
      toast.error("No questions found — check the sheet matches the template columns.");
      return;
    }
    applyQuestions([...questions, ...parsed]);
    setEditorOpen(true); // land the trainer straight in the editable view
    toast.success(`Imported ${parsed.length} — opening the editor`);
  };

  const diffMix = questions.reduce(
    (m, q) => ({ ...m, [q.difficulty]: (m[q.difficulty] ?? 0) + 1 }),
    {} as Record<string, number>,
  );

  return (
    <>
      {/* Questions — build here, edit each one in the full editor */}
      <div className="grid gap-2">
        <Label>Questions</Label>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-[510]">
                {questions.length === 0
                  ? "No questions yet"
                  : `${questions.length} question${questions.length === 1 ? "" : "s"}`}
              </p>
              {questions.length > 0 && (
                <p className="tnum text-xs text-muted-foreground">
                  {diffMix["easy"] ?? 0}E / {diffMix["medium"] ?? 0}M / {diffMix["hard"] ?? 0}H
                </p>
              )}
            </div>
            <Button type="button" size="sm" onClick={() => setEditorOpen(true)}>
              <Pencil className="size-4" strokeWidth={1.75} />
              {questions.length === 0 ? "Build questions" : "Edit questions"}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Select value={a.templateId || "none"} onValueChange={(v) => void loadTemplate(v)}>
              <SelectTrigger className="h-9 w-full sm:w-56" aria-label="Question template">
                <SelectValue placeholder="Start from a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
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
              onClick={() => uploadRef.current?.click()}
            >
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
            <input
              ref={uploadRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importCsv(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
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
            <RadioGroupItem value="completion" id={`cc-completion-${a.id}`} className="mt-0.5" />
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

      <QuizEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        quizName={a.name}
        initialQuestions={questions}
        onSave={applyQuestions}
      />
    </>
  );
}
