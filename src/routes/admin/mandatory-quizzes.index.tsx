import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { getAssignableModules, getMandatoryQuizzes, setQuizMandatory } from "@/data/repositories";
import { EmptyState } from "@/components/lessons/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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
import { formatDate } from "@/lib/format";
import { DownloadCsvButton } from "@/components/download-csv-button";

export const Route = createFileRoute("/admin/mandatory-quizzes/")({
  head: () => ({
    meta: [
      { title: "Mandatory Quizzes — Lessons Admin" },
      {
        name: "description",
        content:
          "Track who has and hasn't completed each compliance-mandatory quiz at Netscribes.",
      },
      { property: "og:title", content: "Mandatory Quizzes — Lessons Admin" },
      {
        property: "og:description",
        content:
          "Track who has and hasn't completed each compliance-mandatory quiz at Netscribes.",
      },
    ],
  }),
  component: MandatoryQuizzesPage,
});

function MandatoryQuizzesPage() {
  const navigate = useNavigate();
  const { data: quizzes = [], isPending } = useQuery({
    queryKey: ["mandatory-quizzes"],
    queryFn: getMandatoryQuizzes,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-title">Mandatory Quizzes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compliance-tracked quizzes. Open one to see who is still outstanding.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <DownloadCsvButton
            slug="mandatory-quizzes"
            headers={["Quiz", "Module", "Program", "Skill", "Completed", "Enrolled", "Completion %", "Due date"]}
            rows={quizzes.map((quiz) => [quiz.quizName, quiz.moduleTitle, quiz.programTitle, quiz.skillTitle, quiz.completed, quiz.enrolled, quiz.completionPct, quiz.dueDate])}
          />
          <MarkMandatoryDialog />
        </div>
      </header>

      {isPending ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No mandatory quizzes"
          description="Flag a quiz as compliance-tracked to start following completion."
        />
      ) : (
        <section className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz</TableHead>
                <TableHead className="hidden md:table-cell">Program / Skill</TableHead>
                <TableHead className="w-56">Completion</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Due</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.map((q) => (
                <TableRow
                  key={q.id}
                  className="cursor-pointer"
                  onClick={() =>
                    void navigate({
                      to: "/admin/mandatory-quizzes/$quizId",
                      params: { quizId: q.quizId },
                    })
                  }
                >
                  <TableCell className="min-w-0">
                    <span className="block truncate text-sm font-[510]">{q.quizName}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {q.moduleTitle}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {q.programTitle} · {q.skillTitle}
                  </TableCell>
                  <TableCell>
                    <Progress
                      value={q.completionPct}
                      className="h-1.5"
                      indicatorClassName="bg-cat-mandatory"
                    />
                    <span className="tnum mt-1.5 block text-xs text-muted-foreground">
                      {q.completed} / {q.enrolled} completed
                    </span>
                  </TableCell>
                  <TableCell className="tnum hidden text-right text-xs text-muted-foreground sm:table-cell">
                    {formatDate(q.dueDate)}
                  </TableCell>
                  <TableCell className="tnum text-right text-sm font-[510]">
                    {q.completionPct}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}

function MarkMandatoryDialog() {
  const [open, setOpen] = useState(false);
  const [quizId, setQuizId] = useState("");
  const queryClient = useQueryClient();
  const { data: modules = [] } = useQuery({
    queryKey: ["assignable-modules"],
    queryFn: getAssignableModules,
  });

  const mutation = useMutation({
    mutationFn: () => setQuizMandatory(quizId, true),
    onSuccess: () => {
      toast.success("Quiz marked mandatory");
      setQuizId("");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["mandatory-quizzes"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="shrink-0">
          <Plus className="size-4" strokeWidth={2} />
          Mark quiz mandatory
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark a quiz mandatory</DialogTitle>
          <DialogDescription>
            Pick a module quiz to compliance-track. Trainers can also flag one in the module
            editor.
          </DialogDescription>
        </DialogHeader>
        <Select value={quizId} onValueChange={setQuizId}>
          <SelectTrigger className="h-9" aria-label="Pick a quiz">
            <SelectValue placeholder="Pick a quiz" />
          </SelectTrigger>
          <SelectContent>
            {modules.map((m) => (
              <SelectItem key={m.id} value={`${m.id}-quiz`}>
                {m.title} — assessment
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!quizId || mutation.isPending} onClick={() => mutation.mutate()}>
            Mark mandatory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
