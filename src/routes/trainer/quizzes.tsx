import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileQuestion, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";

import { getQuizResults, getQuizTemplates, getTemplateQuestions } from "@/data/repositories";
import type { BuilderQuestion, QuizSettings } from "@/data/types";
import { DifficultyBadge } from "@/components/lessons/badges";
import { EmptyState } from "@/components/lessons/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trainer/quizzes")({
  head: () => ({
    meta: [
      { title: "Quiz builder — Lessons Trainer" },
      {
        name: "description",
        content:
          "Build quizzes from a pre-built template or an Excel upload, and review learner results.",
      },
      { property: "og:title", content: "Quiz builder — Lessons Trainer" },
      {
        property: "og:description",
        content:
          "Build quizzes from a pre-built template or an Excel upload, and review learner results.",
      },
    ],
  }),
  component: QuizBuilderPage,
});

const DEFAULT_SETTINGS: QuizSettings = {
  shuffle: true,
  passingPct: 70,
  maxReattempts: 2,
  timeLimitMins: 15,
};

function QuizBuilderPage() {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<BuilderQuestion[]>([]);
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);
  const [dragOver, setDragOver] = useState(false);

  const { data: templates = [], isPending } = useQuery({
    queryKey: ["quiz-templates"],
    queryFn: getQuizTemplates,
  });
  const { data: results = [], isPending: resultsPending } = useQuery({
    queryKey: ["quiz-results", templateId ?? "none"],
    queryFn: () => getQuizResults(templateId ?? "qt-preview"),
  });

  const pickTemplate = async (id: string) => {
    setTemplateId(id);
    const loaded = await getTemplateQuestions(id);
    setQuestions(loaded);
    const t = templates.find((x) => x.id === id);
    if (t) setSettings((s) => ({ ...s, timeLimitMins: t.timeLimitMins }));
  };

  const setQuestion = (id: string, patch: Partial<BuilderQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-title">Quiz builder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start from a pre-built quiz template or upload the Excel template — no quiz design
          from scratch.
        </p>
      </header>

      <Tabs defaultValue="build">
        <TabsList>
          <TabsTrigger value="build">Build</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="build" className="mt-5 grid gap-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <section
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                toast.success("Template uploaded — questions imported");
              }}
              className={cn(
                "surface flex flex-col items-center justify-center px-6 py-10 text-center",
                dragOver && "border-primary",
              )}
            >
              <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
                <Upload className="size-5 text-muted-foreground" strokeWidth={1.75} />
              </div>
              <p className="text-card-title">Upload an Excel template</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Drop an .xlsx file here, or browse. Questions, options and difficulty are read
                from the sheet.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button size="sm" variant="outline">
                  Browse files
                </Button>
                <Button size="sm" variant="ghost">
                  <Download className="size-4" strokeWidth={1.75} />
                  Download sample template
                </Button>
              </div>
            </section>

            <section className="surface p-4 sm:p-5">
              <h2 className="text-card-title">Start from a quiz template</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Pre-built assessments maintained by the L&amp;D team.
              </p>
              {isPending ? (
                <Skeleton className="mt-4 h-32 rounded-lg" />
              ) : templates.length === 0 ? (
                <EmptyState
                  icon={FileSpreadsheet}
                  title="No templates yet"
                  description="Quiz templates published by L&D will appear here."
                />
              ) : (
                <ul className="mt-4 grid gap-2">
                  {templates.map((t) => (
                    <li
                      key={t.id}
                      className={cn(
                        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border px-3 py-2.5",
                        templateId === t.id && "border-primary bg-primary/5",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-[510]">{t.name}</p>
                        <p className="tnum truncate text-xs text-muted-foreground">
                          {t.questionCount} questions · {t.timeLimitMins} min · {t.mix.easy}E/
                          {t.mix.medium}M/{t.mix.hard}H
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => pickTemplate(t.id)}>
                        Use
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="surface p-4 sm:p-5">
            <h2 className="text-card-title">Questions</h2>
            {questions.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={FileQuestion}
                  title="No questions yet"
                  description="Pick a template or upload the Excel sheet to load questions."
                />
              </div>
            ) : (
              <ul className="mt-4 grid gap-3">
                {questions.map((q, i) => (
                  <li key={q.id} className="rounded-lg border border-border p-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <p className="min-w-0 text-sm font-[510]">
                        <span className="tnum mr-2 text-muted-foreground">{i + 1}.</span>
                        {q.prompt}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <DifficultyBadge difficulty={q.difficulty} />
                        <Select
                          value={q.difficulty}
                          onValueChange={(v) =>
                            setQuestion(q.id, { difficulty: v as BuilderQuestion["difficulty"] })
                          }
                        >
                          <SelectTrigger
                            className="h-8 w-[104px]"
                            aria-label="Question difficulty"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                      {q.options.map((o, oi) => (
                        <li
                          key={o}
                          className={cn(
                            "rounded-md border border-border px-2.5 py-1.5 text-sm text-muted-foreground",
                            oi === q.correctIndex && "border-status-complete/40 text-foreground",
                          )}
                        >
                          {o}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 grid gap-1.5">
                      <Label htmlFor={`ex-${q.id}`} className="text-muted-foreground">
                        Explanation (optional)
                      </Label>
                      <Input
                        id={`ex-${q.id}`}
                        value={q.explanation}
                        onChange={(e) => setQuestion(q.id, { explanation: e.target.value })}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="surface grid gap-4 p-4 sm:grid-cols-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 sm:col-span-1">
              <Label htmlFor="shuffle">Shuffle questions</Label>
              <Switch
                id="shuffle"
                checked={settings.shuffle}
                onCheckedChange={(v) => setSettings({ ...settings, shuffle: v })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pass">Passing %</Label>
              <Input
                id="pass"
                type="number"
                min={0}
                max={100}
                className="tnum"
                value={settings.passingPct}
                onChange={(e) => setSettings({ ...settings, passingPct: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="reattempts">Max reattempts</Label>
              <Input
                id="reattempts"
                type="number"
                min={0}
                className="tnum"
                value={settings.maxReattempts}
                onChange={(e) =>
                  setSettings({ ...settings, maxReattempts: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="limit">Time limit (min)</Label>
              <Input
                id="limit"
                type="number"
                min={1}
                className="tnum"
                value={settings.timeLimitMins}
                onChange={(e) =>
                  setSettings({ ...settings, timeLimitMins: Number(e.target.value) })
                }
              />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="results" className="mt-5">
          <section className="surface overflow-hidden">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-card-title">Scores by learner</h2>
                <p className="text-xs text-muted-foreground">
                  Suspiciously fast completions are flagged.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => toast.success("Export started")}
              >
                <Download className="size-4" strokeWidth={1.75} />
                Export
              </Button>
            </div>

            {resultsPending ? (
              <div className="p-4">
                <Skeleton className="h-64 rounded-lg" />
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                icon={FileQuestion}
                title="No attempts yet"
                description="Scores appear here once learners submit this quiz."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Learner</TableHead>
                      <TableHead className="hidden sm:table-cell">Team</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Time taken</TableHead>
                      <TableHead className="text-right">Attempts</TableHead>
                      <TableHead className="text-right">Flag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r) => (
                      <TableRow key={r.learnerId}>
                        <TableCell className="text-sm font-[510]">{r.name}</TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                          {r.team}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "tnum text-right text-sm",
                            r.passed ? "text-status-complete" : "text-status-overdue",
                          )}
                        >
                          {r.scorePct}%
                        </TableCell>
                        <TableCell className="tnum text-right text-sm">
                          {r.timeTakenMins} min
                        </TableCell>
                        <TableCell className="tnum text-right text-sm">{r.attempts}</TableCell>
                        <TableCell className="text-right">
                          {r.outlier && (
                            <span className="inline-flex items-center rounded-sm border border-status-overdue/30 bg-status-overdue/10 px-1.5 py-0.5 text-[11px] leading-none font-[510] text-status-overdue">
                              Outlier
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
