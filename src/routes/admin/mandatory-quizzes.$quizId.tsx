import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BellRing, Check, Download, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { getMandatoryQuizzes, getQuizCompletion, sendQuizReminder } from "@/data/repositories";
import type { QuizCompletionRow } from "@/data/types";
import { EmptyState } from "@/components/lessons/empty-state";
import { ProgressRing } from "@/components/lessons/progress-ring";
import { useCountUp } from "@/components/lessons/count-up";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCsv, slugify, toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/mandatory-quizzes/$quizId")({
  head: () => ({
    meta: [
      { title: "Quiz compliance — Lessons Admin" },
      {
        name: "description",
        content: "See who has completed a mandatory quiz, download the list and send reminders.",
      },
      { property: "og:title", content: "Quiz compliance — Lessons Admin" },
      {
        property: "og:description",
        content: "See who has completed a mandatory quiz, download the list and send reminders.",
      },
    ],
  }),
  component: QuizCompliancePage,
});

type Filter = "all" | "completed" | "not-completed";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "not-completed", label: "Not completed" },
];

function QuizCompliancePage() {
  const { quizId } = Route.useParams();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [team, setTeam] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

  const { data: quizzes = [] } = useQuery({
    queryKey: ["mandatory-quizzes"],
    queryFn: getMandatoryQuizzes,
  });
  const quiz = quizzes.find((q) => q.quizId === quizId);

  const { data: rows = [], isPending } = useQuery({
    queryKey: ["quiz-completion", quizId],
    queryFn: () => getQuizCompletion(quizId),
  });

  const completed = rows.filter((r) => r.status === "completed");
  const notCompleted = rows.filter((r) => r.status === "not-completed");
  const pct = rows.length ? Math.round((completed.length / rows.length) * 100) : 0;

  const teams = useMemo(
    () => Array.from(new Set(rows.map((row) => row.team))).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          (filter === "all" || row.status === filter) &&
          (team === "all" || row.team === team),
      ),
    [rows, filter, team],
  );

  const shownCompleted = useCountUp(completed.length);
  const shownOutstanding = useCountUp(notCompleted.length);

  const reminder = useMutation({
    mutationFn: () => sendQuizReminder(quizId, selected),
    onSuccess: (res) => {
      toast.success(`Reminder sent to ${res.sent} learner${res.sent === 1 ? "" : "s"}`);
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: ["quiz-completion", quizId] });
    },
  });

  const name = quiz?.quizName ?? "Mandatory quiz";

  function download(list: QuizCompletionRow[], suffix: string) {
    const csv = toCsv(
      ["Name", "Email", "Team", "Status", "Completed on", "Score %", "Attempts", "Last reminded"],
      list.map((r) => [
        r.name,
        r.email,
        r.team,
        r.status === "completed" ? "Completed" : "Not completed",
        r.completedOn ?? "",
        r.scorePct ?? "",
        r.attempts,
        r.lastRemindedOn ?? "",
      ]),
    );
    downloadCsv(`mandatory-quiz-${slugify(name)}-completion${suffix}.csv`, csv);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link
        to="/admin/mandatory-quizzes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Mandatory quizzes
      </Link>

      <header className="surface mb-5 flex flex-wrap items-center gap-5 p-5">
        <ProgressRing value={pct} size={64} stroke={5} color="var(--cat-mandatory)" />
        <div className="min-w-0 flex-1">
          <h1 className="text-title truncate">{name}</h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {quiz ? `${quiz.moduleTitle} · ${quiz.programTitle} · ${quiz.skillTitle}` : "Compliance-tracked quiz"}
          </p>
          {quiz && (
            <p className="tnum mt-0.5 text-xs text-muted-foreground">
              Due {formatDate(quiz.dueDate)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <div
            className="soft-tile rounded-xl px-4 py-2.5"
            style={{ ["--tile-tint" as string]: "var(--chart-1)" }}
          >
            <p className="text-label text-muted-foreground">Completed</p>
            <p className="tnum mt-0.5 text-xl font-[510]">{shownCompleted}</p>
          </div>
          <div
            className="soft-tile rounded-xl px-4 py-2.5"
            style={{ ["--tile-tint" as string]: "var(--chart-5)" }}
          >
            <p className="text-label text-muted-foreground">Outstanding</p>
            <p className="tnum mt-0.5 text-xl font-[510]">{shownOutstanding}</p>
          </div>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-border p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded px-3 py-1.5 text-sm transition-colors",
                  filter === f.id
                    ? "bg-accent font-[510] text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Select value={team} onValueChange={setTeam}>
            <SelectTrigger className="h-9 w-44" aria-label="Filter by team">
              <SelectValue placeholder="All teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teams</SelectItem>
              {teams.map((teamName) => (
                <SelectItem key={teamName} value={teamName}>
                  {teamName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={completed.length === 0}
            onClick={() => download(completed, "-completed")}
          >
            <Download className="size-4" strokeWidth={1.75} />
            Download completed
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={rows.length === 0}
            onClick={() => download(rows, "")}
          >
            <Download className="size-4" strokeWidth={1.75} />
            Download all
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={notCompleted.length === 0}
            onClick={() => setSelected(notCompleted.map((r) => r.learnerId))}
          >
            Select all not completed
          </Button>
          <Button
            size="sm"
            disabled={selected.length === 0 || reminder.isPending}
            onClick={() => reminder.mutate()}
          >
            <BellRing className="size-4" strokeWidth={1.75} />
            Send reminder{selected.length > 0 ? ` (${selected.length})` : ""}
          </Button>
        </div>
      </div>

      {isPending ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nobody here"
          description="No learners match this filter."
        />
      ) : (
        <section className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden text-right md:table-cell">Completed on</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Attempts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={r.learnerId}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(r.learnerId)}
                      aria-label={`Select ${r.name}`}
                      onCheckedChange={(v) =>
                        setSelected((s) =>
                          v ? [...s, r.learnerId] : s.filter((id) => id !== r.learnerId),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="min-w-0">
                    <span className="block truncate text-sm font-[510]">{r.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.email}</span>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {r.team}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          r.status === "completed"
                            ? "bg-status-complete"
                            : "bg-status-overdue",
                        )}
                      />
                      {r.status === "completed" ? "Completed" : "Not completed"}
                      {r.lastRemindedOn && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[11px]"
                          title={`Reminded ${formatDate(r.lastRemindedOn)}`}
                        >
                          <Check className="size-3" strokeWidth={2} />
                          reminded
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="tnum hidden text-right text-xs text-muted-foreground md:table-cell">
                    {r.completedOn ? formatDate(r.completedOn) : "—"}
                  </TableCell>
                  <TableCell className="tnum text-right text-sm">
                    {r.scorePct === null ? "—" : `${r.scorePct}%`}
                  </TableCell>
                  <TableCell className="tnum text-right text-sm">{r.attempts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}
