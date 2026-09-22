import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { toast } from "sonner";

import {
  bulkLearnerAction,
  getEnrolledLearners,
  getModuleAnalytics,
  reassignLearner,
} from "@/data/repositories";
import type { EnrolledLearner, EnrolledStatus } from "@/data/types";
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
import { DownloadCsvButton } from "@/components/download-csv-button";

const FILTERS: { value: EnrolledStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "complete", label: "Complete" },
];

interface AdvFilters {
  team: string;
  designation: string;
  department: string;
  location: string;
  employeeType: string;
  functionArea: string;
  grade: string;
  manager: string;
  joinedAfter: string;
}

const EMPTY_ADV: AdvFilters = {
  team: "all",
  designation: "all",
  department: "all",
  location: "all",
  employeeType: "all",
  functionArea: "all",
  grade: "all",
  manager: "all",
  joinedAfter: "",
};

export function AudienceTab({ moduleId }: { moduleId: string }) {
  const [filter, setFilter] = useState<EnrolledStatus | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [adv, setAdv] = useState<AdvFilters>(EMPTY_ADV);

  const { data: analytics, isPending: analyticsPending } = useQuery({
    queryKey: ["module-analytics", moduleId],
    queryFn: () => getModuleAnalytics(moduleId),
  });
  const { data: learners = [], isPending } = useQuery({
    queryKey: ["enrolled-learners", moduleId],
    queryFn: () => getEnrolledLearners(moduleId),
  });

  const facet = useMemo(() => {
    const uniq = (get: (l: EnrolledLearner) => string) =>
      Array.from(new Set(learners.map(get)))
        .filter(Boolean)
        .sort();
    return {
      team: uniq((l) => l.team),
      designation: uniq((l) => l.designation),
      department: uniq((l) => l.department),
      location: uniq((l) => l.location),
      functionArea: uniq((l) => l.functionArea),
      grade: uniq((l) => l.grade),
      manager: uniq((l) => l.manager),
    };
  }, [learners]);

  const activeAdvCount = useMemo(
    () =>
      (Object.keys(EMPTY_ADV) as (keyof AdvFilters)[]).filter((k) => adv[k] && adv[k] !== "all")
        .length,
    [adv],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const eq = (value: string, f: string) => f === "all" || value === f;
    return learners.filter(
      (l) =>
        (filter === "all" || l.status === filter) &&
        (!q ||
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.userId.toLowerCase().includes(q)) &&
        eq(l.team, adv.team) &&
        eq(l.designation, adv.designation) &&
        eq(l.department, adv.department) &&
        eq(l.location, adv.location) &&
        eq(l.employeeType, adv.employeeType) &&
        eq(l.functionArea, adv.functionArea) &&
        eq(l.grade, adv.grade) &&
        eq(l.manager, adv.manager) &&
        (!adv.joinedAfter || l.joiningDate >= adv.joinedAfter),
    );
  }, [learners, filter, search, adv]);

  const counts = useMemo(
    () => ({
      all: learners.length,
      "not-started": learners.filter((l) => l.status === "not-started").length,
      "in-progress": learners.filter((l) => l.status === "in-progress").length,
      complete: learners.filter((l) => l.status === "complete").length,
    }),
    [learners],
  );

  const setAdvField = (key: keyof AdvFilters, value: string) => {
    setAdv((prev) => ({ ...prev, [key]: value }));
    setSelected([]);
  };

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
          <StatTile
            label="Completion"
            value={analytics?.completionPct ?? 0}
            suffix="%"
            tint="var(--chart-1)"
            tone="solid"
          />
          <StatTile
            label="Pass rate"
            value={analytics?.passRatePct ?? 0}
            suffix="%"
            tint="var(--chart-2)"
            tone="soft"
          />
          <StatTile
            label="Avg time"
            value={analytics?.avgTimeMins ?? 0}
            suffix=" min"
            tint="var(--chart-4)"
            tone="soft"
          />
        </div>
      )}

      {/* Advanced learner search — mirrors the admin directory */}
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelected([]);
              }}
              placeholder="Search name, user ID or email"
              aria-label="Search learners"
              className="h-9 pl-8"
            />
          </div>
          <Button
            size="sm"
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="size-4" strokeWidth={1.75} />
            Filters
            {activeAdvCount > 0 && (
              <span className="tnum ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {activeAdvCount}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <section className="sky-panel animate-soft-in grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <AudSlicer
              label="Team / Division"
              value={adv.team}
              onChange={(v) => setAdvField("team", v)}
              options={facetOptions("All teams", facet.team)}
            />
            <AudSlicer
              label="Function"
              value={adv.functionArea}
              onChange={(v) => setAdvField("functionArea", v)}
              options={facetOptions("All functions", facet.functionArea)}
            />
            <AudSlicer
              label="Designation"
              value={adv.designation}
              onChange={(v) => setAdvField("designation", v)}
              options={facetOptions("All designations", facet.designation)}
            />
            <AudSlicer
              label="Department"
              value={adv.department}
              onChange={(v) => setAdvField("department", v)}
              options={facetOptions("All departments", facet.department)}
            />
            <AudSlicer
              label="Location"
              value={adv.location}
              onChange={(v) => setAdvField("location", v)}
              options={facetOptions("All locations", facet.location)}
            />
            <AudSlicer
              label="Employee type"
              value={adv.employeeType}
              onChange={(v) => setAdvField("employeeType", v)}
              options={[
                { value: "all", label: "All types" },
                { value: "full-time", label: "full-time" },
                { value: "contract", label: "contract" },
                { value: "intern", label: "intern" },
              ]}
            />
            <AudSlicer
              label="Grade"
              value={adv.grade}
              onChange={(v) => setAdvField("grade", v)}
              options={facetOptions("All grades", facet.grade)}
            />
            <AudSlicer
              label="Manager"
              value={adv.manager}
              onChange={(v) => setAdvField("manager", v)}
              options={facetOptions("All managers", facet.manager)}
            />
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Joined on/after</Label>
              <Input
                type="date"
                value={adv.joinedAfter}
                onChange={(e) => setAdvField("joinedAfter", e.target.value)}
                className="h-9"
                aria-label="Joined on or after"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAdv(EMPTY_ADV);
                  setSearch("");
                  setSelected([]);
                }}
                disabled={activeAdvCount === 0 && !search}
              >
                <X className="size-4" strokeWidth={1.75} />
                Clear all
              </Button>
            </div>
          </section>
        )}
      </div>

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
              <span className="tnum ml-1.5 text-xs text-muted-foreground">{counts[f.value]}</span>
            </Button>
          ))}
          <div className="ml-auto">
            <DownloadCsvButton
              slug="trainer-enrolled-learners"
              headers={[
                "Name",
                "Email",
                "Team",
                "Status",
                "Progress %",
                "Due date",
                "Last activity",
              ]}
              rows={rows.map((row) => [
                row.name,
                row.email,
                row.team,
                row.status,
                row.progressPct,
                row.dueDate,
                row.lastActivity,
              ])}
            />
          </div>
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
                      onCheckedChange={(v) => setSelected(v === true ? rows.map((r) => r.id) : [])}
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

function facetOptions(allLabel: string, values: string[]) {
  return [{ value: "all", label: allLabel }, ...values.map((v) => ({ value: v, label: v }))];
}

function AudSlicer({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="capitalize">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
