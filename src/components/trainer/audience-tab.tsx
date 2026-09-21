import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Users } from "lucide-react";
import { toast } from "sonner";

import {
  bulkLearnerAction,
  getEnrolledLearners,
  getModuleAnalytics,
  reassignLearner,
} from "@/data/repositories";
import type { EnrolledStatus } from "@/data/types";
import { StatTile } from "@/components/lessons/count-up";
import { EmptyState } from "@/components/lessons/empty-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const FILTERS: { value: EnrolledStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "complete", label: "Complete" },
];

export function AudienceTab({ moduleId }: { moduleId: string }) {
  const [filter, setFilter] = useState<EnrolledStatus | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);

  const { data: analytics, isPending: analyticsPending } = useQuery({
    queryKey: ["module-analytics", moduleId],
    queryFn: () => getModuleAnalytics(moduleId),
  });
  const { data: learners = [], isPending } = useQuery({
    queryKey: ["enrolled-learners", moduleId],
    queryFn: () => getEnrolledLearners(moduleId),
  });

  const rows = useMemo(
    () => (filter === "all" ? learners : learners.filter((l) => l.status === filter)),
    [learners, filter],
  );

  const counts = useMemo(
    () => ({
      all: learners.length,
      "not-started": learners.filter((l) => l.status === "not-started").length,
      "in-progress": learners.filter((l) => l.status === "in-progress").length,
      complete: learners.filter((l) => l.status === "complete").length,
    }),
    [learners],
  );

  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const runBulk = async (action: "remind" | "unenroll" | "change-due-date") => {
    const result = await bulkLearnerAction(moduleId, selected, action);
    const verb =
      action === "remind"
        ? "Reminder sent to"
        : action === "unenroll"
          ? "Unenrolled"
          : "Due date changed for";
    toast.success(`${verb} ${result.affected} learners`);
    setSelected([]);
  };

  return (
    <div className="grid gap-6">
      {analyticsPending ? (
        <Skeleton className="h-20 rounded-xl" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Completion" value={analytics?.completionPct ?? 0} suffix="%" tint="var(--chart-1)" tone="solid" />
          <StatTile label="Pass rate" value={analytics?.passRatePct ?? 0} suffix="%" tint="var(--chart-2)" tone="soft" />
          <StatTile label="Avg time" value={analytics?.avgTimeMins ?? 0} suffix=" min" tint="var(--chart-4)" tone="soft" />
        </div>
      )}

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? "secondary" : "ghost"}
              onClick={() => setFilter(f.value)}
              className="h-8"
            >
              {f.label}
              <span className="tnum ml-1.5 text-xs text-muted-foreground">
                {counts[f.value]}
              </span>
            </Button>
          ))}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-3 py-2.5">
            <span className="tnum text-sm">{selected.length} selected</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => runBulk("remind")}>
                Send reminder
              </Button>
              <Button size="sm" variant="outline" onClick={() => runBulk("change-due-date")}>
                Change due date
              </Button>
              <Button size="sm" variant="outline" onClick={() => runBulk("unenroll")}>
                Unenroll
              </Button>
            </div>
          </div>
        )}

        {isPending ? (
          <div className="p-4">
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No learners here"
            description="Nobody matches this filter yet. Publish or push-enroll to add learners."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allChecked}
                      aria-label="Select all"
                      onCheckedChange={(v) =>
                        setSelected(v === true ? rows.map((r) => r.id) : [])
                      }
                    />
                  </TableHead>
                  <TableHead>Learner</TableHead>
                  <TableHead className="hidden sm:table-cell">Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Last activity</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(l.id)}
                        aria-label={`Select ${l.name}`}
                        onCheckedChange={(v) =>
                          setSelected((prev) =>
                            v === true ? [...prev, l.id] : prev.filter((id) => id !== l.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="min-w-0">
                      <span className="block truncate text-sm font-[510]">{l.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {l.email}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {l.team}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[l.status])}
                        />
                        {STATUS_LABEL[l.status]}
                      </span>
                    </TableCell>
                    <TableCell className="tnum text-right text-sm">{l.progressPct}%</TableCell>
                    <TableCell className="hidden text-right text-xs text-muted-foreground sm:table-cell">
                      {l.lastActivity}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Actions for ${l.name}`}
                          >
                            <MoreHorizontal className="size-4" strokeWidth={1.75} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => {
                              void bulkLearnerAction(moduleId, [l.id], "remind").then(() =>
                                toast.success(`Reminder sent to ${l.name}`),
                              );
                            }}
                          >
                            Send reminder
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              void reassignLearner(moduleId, l.id).then(() =>
                                toast.success(`${l.name} reassigned — progress reset`),
                              );
                            }}
                          >
                            Reassign / reset
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
