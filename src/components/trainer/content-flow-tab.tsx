import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  GripVertical,
  Image as ImageIcon,
  Link2,
  ListChecks,
  Plus,
  Trash2,
  Video,
} from "lucide-react";

import type { ActivityType, DraftActivity, ModuleDraft } from "@/data/types";
import { getCertificateTemplates, getFeedbackSurveys } from "@/data/repositories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/lessons/empty-state";
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
  const { data: certTemplates = [] } = useQuery({
    queryKey: ["certificate-templates"],
    queryFn: getCertificateTemplates,
  });
  const { data: surveys = [] } = useQuery({
    queryKey: ["feedback-surveys"],
    queryFn: getFeedbackSurveys,
  });

  const setActivities = (activities: DraftActivity[]) => onChange({ ...draft, activities });

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

  const addActivity = (type: ActivityType) =>
    setActivities([
      ...draft.activities,
      {
        id: `new-${Date.now()}`,
        name: `New ${type}`,
        type,
        meta: NEW_ACTIVITY_META[type],
        required: true,
        draft: true,
      },
    ]);

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
            <Label>Poster image</Label>
            <div className="overflow-hidden rounded-lg border border-border">
              <img
                src={draft.posterImage}
                alt="Module poster"
                className="aspect-video w-full object-cover"
              />
            </div>
            <Button variant="outline" size="sm" className="mt-1">
              <ImageIcon className="size-4" strokeWidth={1.75} />
              Change poster
            </Button>
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
                      "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5",
                      dragId === a.id && "opacity-60",
                    )}
                  >
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="size-4 cursor-grab" strokeWidth={1.75} />
                      <span className="tnum w-4 text-xs">{i + 1}</span>
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-[510]">{a.name}</span>
                      <span className="block truncate text-xs text-muted-foreground capitalize">
                        {a.type} · {a.meta}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <label className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                        Required
                        <Switch
                          checked={a.required}
                          onCheckedChange={(v) =>
                            setActivities(
                              draft.activities.map((x) =>
                                x.id === a.id ? { ...x, required: v } : x,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                        Draft
                        <Switch
                          checked={a.draft}
                          onCheckedChange={(v) =>
                            setActivities(
                              draft.activities.map((x) =>
                                x.id === a.id ? { ...x, draft: v } : x,
                              ),
                            )
                          }
                        />
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${a.name}`}
                        onClick={() =>
                          setActivities(draft.activities.filter((x) => x.id !== a.id))
                        }
                      >
                        <Trash2 className="size-4" strokeWidth={1.75} />
                      </Button>
                    </span>
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
                      selectedCert?.orientation === "portrait"
                        ? "aspect-[3/4]"
                        : "aspect-[4/3]",
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
