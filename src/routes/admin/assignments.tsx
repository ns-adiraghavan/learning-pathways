import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardList, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getAssignableModules, getModuleAssignments, updateAssignment } from "@/data/repositories";
import type { ModuleAssignment } from "@/data/types";
import { EmptyState } from "@/components/lessons/empty-state";
import { DownloadCsvButton } from "@/components/download-csv-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { STATUS_DOT, STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — Lessons Admin" },
      {
        name: "description",
        content: "Edit who is assigned to a module across teams and change due dates.",
      },
      { property: "og:title", content: "Assignments — Lessons Admin" },
      {
        property: "og:description",
        content: "Edit who is assigned to a module across teams and change due dates.",
      },
    ],
  }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [moduleQuery, setModuleQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<"user" | "team">("user");
  const [dueDate, setDueDate] = useState("");
  const queryClient = useQueryClient();

  const { data: modules = [], isPending: modulesPending } = useQuery({
    queryKey: ["assignable-modules"],
    queryFn: getAssignableModules,
  });

  const selectedModule = modules.find((m) => m.id === moduleId) ?? null;

  // Search across module title, program and skill.
  const matches = useMemo(() => {
    const q = moduleQuery.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.programTitle.toLowerCase().includes(q) ||
        m.skillTitle.toLowerCase().includes(q),
    );
  }, [modules, moduleQuery]);
  const { data: assignments = [], isPending } = useQuery({
    queryKey: ["module-assignments", moduleId],
    queryFn: () => getModuleAssignments(moduleId!),
    enabled: !!moduleId,
  });

  const mutation = useMutation({
    mutationFn: (change: Parameters<typeof updateAssignment>[1]) =>
      updateAssignment(moduleId!, change),
    onSuccess: (rows) => {
      queryClient.setQueryData(["module-assignments", moduleId], rows);
      setSelected([]);
    },
  });

  const addAssignee = () => {
    if (!newName.trim()) return;
    const assignment: ModuleAssignment = {
      id: `new-${Date.now()}`,
      kind: newKind,
      name: newName.trim(),
      detail: newKind === "team" ? "Added by admin" : "Added by admin",
      headcount: newKind === "team" ? 25 : 1,
      dueDate: dueDate || "30 Apr 2026",
      status: "not-started",
      progressPct: 0,
    };
    mutation.mutate({ op: "add", assignment });
    toast.success(`${assignment.name} assigned`);
    setNewName("");
  };

  const allChecked = assignments.length > 0 && assignments.every((a) => selected.includes(a.id));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-title">Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a module, then add or remove learners and teams, or move the due date.
        </p>
      </header>

      <div className="surface mb-4 grid gap-3 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Label htmlFor="module-search">Module</Label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="module-search"
                value={moduleQuery}
                onChange={(e) => setModuleQuery(e.target.value)}
                placeholder="Search by program, skill or module"
                className="h-9 pl-8"
                aria-label="Search modules by program, skill or module"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="tnum text-sm text-muted-foreground">
              {moduleId ? `${assignments.length} assignment rows` : "No module selected"}
            </p>
            <DownloadCsvButton
              slug="admin-assignments"
              disabled={!moduleId}
              headers={["Type", "Assignee", "Detail", "People", "Status", "Progress %", "Due date"]}
              rows={assignments.map((row) => [
                row.kind,
                row.name,
                row.detail,
                row.headcount,
                row.status,
                row.progressPct,
                row.dueDate,
              ])}
            />
          </div>
        </div>

        {modulesPending ? (
          <Skeleton className="h-32 rounded-md" />
        ) : (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
            {matches.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No modules match “{moduleQuery}”.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {matches.map((m) => {
                  const active = m.id === moduleId;
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => setModuleId(m.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          active ? "bg-primary/5" : "hover:bg-accent",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border",
                          )}
                        >
                          {active && <Check className="size-3" strokeWidth={2.5} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-[510]">{m.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {m.programTitle} › {m.skillTitle}
                          </span>
                        </span>
                        <span className="tnum shrink-0 text-xs text-muted-foreground">
                          {m.assignedCount} assigned
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {selectedModule && (
          <p className="text-xs text-muted-foreground">
            Editing assignments for{" "}
            <span className="font-[510] text-foreground">{selectedModule.title}</span> ·{" "}
            {selectedModule.programTitle} › {selectedModule.skillTitle}
          </p>
        )}
      </div>

      {!moduleId ? (
        <EmptyState
          icon={ClipboardList}
          title="Choose a module"
          description="Pick a module above to see and edit who is assigned to it."
        />
      ) : isPending ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <>
          <div className="surface mb-4 grid gap-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-end">
            <div className="grid gap-1.5">
              <Label htmlFor="kind">Type</Label>
              <Select value={newKind} onValueChange={(v) => setNewKind(v as "user" | "team")}>
                <SelectTrigger id="kind" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Learner</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="assignee">Name</Label>
              <Input
                id="assignee"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={newKind === "team" ? "e.g. Data Tech" : "e.g. Meera Joshi"}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="due">Due date</Label>
              <Input
                id="due"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="30 Apr 2026"
                className="sm:w-36"
              />
            </div>
            <Button onClick={addAssignee} disabled={!newName.trim()}>
              <Plus className="size-4" strokeWidth={2} />
              Assign
            </Button>
          </div>

          {selected.length > 0 && (
            <div className="surface mb-4 flex flex-wrap items-center gap-2 px-3 py-2.5">
              <span className="tnum text-sm">{selected.length} selected</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    mutation.mutate({
                      op: "due-date",
                      assignmentIds: selected,
                      dueDate: dueDate || "18 Jun 2026",
                    });
                    toast.success("Due date updated");
                  }}
                >
                  Change due date
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    mutation.mutate({ op: "remove", assignmentIds: selected });
                    toast.success("Removed from module");
                  }}
                >
                  <Trash2 className="size-4" strokeWidth={1.75} />
                  Remove
                </Button>
              </div>
            </div>
          )}

          {assignments.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nobody assigned yet"
              description="Assign a learner or a whole team using the row above."
            />
          ) : (
            <section className="surface overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allChecked}
                        aria-label="Select all"
                        onCheckedChange={(v) =>
                          setSelected(v === true ? assignments.map((a) => a.id) : [])
                        }
                      />
                    </TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">People</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(a.id)}
                          aria-label={`Select ${a.name}`}
                          onCheckedChange={(v) =>
                            setSelected((prev) =>
                              v === true ? [...prev, a.id] : prev.filter((id) => id !== a.id),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="min-w-0">
                        <span className="block truncate text-sm font-[510]">
                          {a.name}
                          {a.kind === "team" && (
                            <span className="ml-2 rounded-[4px] border border-border px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">
                              Team
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {a.detail}
                        </span>
                      </TableCell>
                      <TableCell className="tnum hidden text-right text-sm sm:table-cell">
                        {a.headcount}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className={cn("size-1.5 rounded-full", STATUS_DOT[a.status])} />
                          {STATUS_LABEL[a.status]}
                        </span>
                      </TableCell>
                      <TableCell className="tnum text-right text-sm">{a.progressPct}%</TableCell>
                      <TableCell className="tnum text-right text-xs text-muted-foreground">
                        {a.dueDate}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          )}
        </>
      )}
    </div>
  );
}
