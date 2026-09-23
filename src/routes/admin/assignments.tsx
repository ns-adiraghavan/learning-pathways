import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, SlidersHorizontal, Users, X } from "lucide-react";
import { toast } from "sonner";

import {
  getAssignableModules,
  getModuleAssignments,
  getUsers,
  updateAssignment,
} from "@/data/repositories";
import type { AdminUser, AssignableModule, ModuleAssignment } from "@/data/types";
import { EmptyState } from "@/components/lessons/empty-state";
import { DownloadCsvButton } from "@/components/download-csv-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SearchBox } from "@/components/ui/search-box";
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
import { isNewJoiner, STATUS_DOT, STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — Lessons Admin" },
      {
        name: "description",
        content: "Assign modules at program, skill or module level to teams or specific people.",
      },
      { property: "og:title", content: "Assignments — Lessons Admin" },
      {
        property: "og:description",
        content: "Assign modules at program, skill or module level to teams or specific people.",
      },
    ],
  }),
  component: AssignmentsPage,
});

type Level = "program" | "skill" | "module";
type AssigneeMode = "teams" | "people";

interface UserFacetFilters {
  functionArea: string;
  designation: string;
  manager: string;
  grade: string;
  employeeType: string;
  location: string;
  status: string;
}

const EMPTY_USER_FILTERS: UserFacetFilters = {
  functionArea: "all",
  designation: "all",
  manager: "all",
  grade: "all",
  employeeType: "all",
  location: "all",
  status: "all",
};

function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [level, setLevel] = useState<Level>("module");
  const [targetKey, setTargetKey] = useState<string>("");
  const [assigneeMode, setAssigneeMode] = useState<AssigneeMode>("teams");
  const [teams, setTeams] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<UserFacetFilters>(EMPTY_USER_FILTERS);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data: modules = [], isPending: modulesPending } = useQuery({
    queryKey: ["assignable-modules"],
    queryFn: getAssignableModules,
  });
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users", "facets"],
    queryFn: () => getUsers(),
  });

  const programTitles = useMemo(
    () => Array.from(new Set(modules.map((m) => m.programTitle))).sort(),
    [modules],
  );
  const skillTitles = useMemo(
    () => Array.from(new Set(modules.map((m) => m.skillTitle))).sort(),
    [modules],
  );

  // Resolve the chosen level to the actual modules being assigned (we assign
  // modules, never skills — picking a program/skill just fans out to its modules).
  const resolvedModules: AssignableModule[] = useMemo(() => {
    if (!targetKey) return [];
    if (level === "module") return modules.filter((m) => m.id === targetKey);
    if (level === "skill") return modules.filter((m) => m.skillTitle === targetKey);
    return modules.filter((m) => m.programTitle === targetKey);
  }, [modules, level, targetKey]);

  const teamOptions = useMemo(() => Array.from(new Set(users.map((u) => u.team))).sort(), [users]);

  const facet = useMemo(() => {
    const uniq = (get: (u: AdminUser) => string) =>
      Array.from(new Set(users.map(get)))
        .filter(Boolean)
        .sort();
    return {
      functionArea: uniq((u) => u.functionArea),
      designation: uniq((u) => u.designation),
      manager: uniq((u) => u.manager),
      grade: uniq((u) => u.grade),
      location: uniq((u) => u.location),
    };
  }, [users]);

  const activeFilterCount = useMemo(
    () =>
      (Object.keys(EMPTY_USER_FILTERS) as (keyof UserFacetFilters)[]).filter(
        (k) => filters[k] !== "all",
      ).length,
    [filters],
  );

  // Qualifying users: learners in the chosen team(s) (or everyone in "people"
  // mode), narrowed by the multi-level filters and the search box.
  const qualifying = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    const eq = (val: string, f: string) => f === "all" || val === f;
    return users.filter(
      (u) =>
        (assigneeMode === "people" || teams.length === 0 || teams.includes(u.team)) &&
        (!q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.userId.toLowerCase().includes(q)) &&
        eq(u.functionArea, filters.functionArea) &&
        eq(u.designation, filters.designation) &&
        eq(u.manager, filters.manager) &&
        eq(u.grade, filters.grade) &&
        eq(u.employeeType, filters.employeeType) &&
        eq(u.location, filters.location) &&
        eq(u.userStatus, filters.status),
    );
  }, [users, assigneeMode, teams, userSearch, filters]);

  // In "teams" mode we don't require a hand-picked selection — assigning covers
  // everyone shown. In "people" mode only the checked users are assigned.
  const willAssignIds =
    assigneeMode === "teams" && selectedUsers.length === 0
      ? qualifying.map((u) => u.id)
      : selectedUsers;

  const previewModuleId = resolvedModules[0]?.id ?? null;
  const { data: assignments = [] } = useQuery({
    queryKey: ["module-assignments", previewModuleId],
    queryFn: () => getModuleAssignments(previewModuleId!),
    enabled: !!previewModuleId,
  });

  const mutation = useMutation({
    mutationFn: (change: Parameters<typeof updateAssignment>[1]) =>
      updateAssignment(previewModuleId!, change),
    onSuccess: (rows) => {
      queryClient.setQueryData(["module-assignments", previewModuleId], rows);
    },
  });

  const allChecked = qualifying.length > 0 && qualifying.every((u) => selectedUsers.includes(u.id));

  const setFilter = (key: keyof UserFacetFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedUsers([]);
  };

  const submit = () => {
    if (resolvedModules.length === 0 || willAssignIds.length === 0) return;
    // Add the picked people to the previewed module so the table below updates;
    // the real backend would fan out across every resolved module.
    if (previewModuleId) {
      const chosen = users.filter((u) => willAssignIds.includes(u.id));
      const existing = new Set(assignments.map((a) => a.name));
      chosen
        .filter((u) => !existing.has(u.name))
        .slice(0, 25)
        .forEach((u) => {
          const assignment: ModuleAssignment = {
            id: `a-${previewModuleId}-${u.id}`,
            kind: "user",
            name: u.name,
            detail: `${u.team} · ${u.designation}`,
            headcount: 1,
            dueDate: "31 Dec 2026",
            status: "not-started",
            progressPct: 0,
          };
          mutation.mutate({ op: "add", assignment });
        });
    }
    toast.success(
      `Assigned ${willAssignIds.length} ${willAssignIds.length === 1 ? "person" : "people"} to ${
        resolvedModules.length
      } module${resolvedModules.length === 1 ? "" : "s"}`,
    );
    setSelectedUsers([]);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-title">Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign at program, skill or module level — to whole teams (like COE) or to specific people
          who qualify.
        </p>
      </header>

      {/* STEP 1 — what to assign */}
      <section className="surface mb-4 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-[590] text-primary-foreground">
            1
          </span>
          <h2 className="text-card-title">What to assign</h2>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label>Level</Label>
            <div className="flex gap-1.5">
              {(["program", "skill", "module"] as Level[]).map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => {
                    setLevel(lv);
                    setTargetKey("");
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm capitalize transition-colors",
                    level === lv
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {lv}
                </button>
              ))}
            </div>
          </div>

          <div className="grid min-w-0 flex-1 gap-1.5">
            <Label htmlFor="target">
              {level === "program" ? "Program" : level === "skill" ? "Skill" : "Module"}
            </Label>
            {modulesPending ? (
              <Skeleton className="h-9 w-full rounded-md" />
            ) : (
              <Select value={targetKey} onValueChange={setTargetKey}>
                <SelectTrigger id="target" className="h-9">
                  <SelectValue placeholder={`Choose a ${level}`} />
                </SelectTrigger>
                <SelectContent>
                  {level === "program"
                    ? programTitles.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))
                    : level === "skill"
                      ? skillTitles.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))
                      : modules.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.title}
                          </SelectItem>
                        ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {resolvedModules.length > 0 && (
          <div className="mt-3 rounded-lg bg-secondary/50 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">
              {level === "module" ? "Assigning module" : `This ${level} fans out to`}{" "}
              <span className="font-[510] text-foreground">
                {resolvedModules.length} module{resolvedModules.length === 1 ? "" : "s"}
              </span>
              :
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {resolvedModules.map((m) => (
                <span
                  key={m.id}
                  className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-[510]"
                >
                  {m.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* STEP 2 — who to assign */}
      {resolvedModules.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Choose what to assign"
          description="Pick a program, skill or module above to choose who it goes to."
        />
      ) : (
        <section className="surface mb-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-[590] text-primary-foreground">
                2
              </span>
              <h2 className="text-card-title">Who gets it</h2>
            </div>
            <div className="flex gap-1.5">
              {(
                [
                  { v: "teams", label: "By team(s)" },
                  { v: "people", label: "Specific people" },
                ] as { v: AssigneeMode; label: string }[]
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => {
                    setAssigneeMode(o.v);
                    setSelectedUsers([]);
                    if (o.v === "people") setTeams([]);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm transition-colors",
                    assigneeMode === o.v
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Team picker */}
          {assigneeMode === "teams" && (
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground">
                Team(s) — everyone who qualifies is assigned unless you pick individuals below
              </Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {teamOptions.map((t) => {
                  const on = teams.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTeams((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]));
                        setSelectedUsers([]);
                      }}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-colors",
                        on
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search + filters over the qualifying users */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SearchBox
              value={userSearch}
              onChange={(v) => {
                setUserSearch(v);
                setSelectedUsers([]);
              }}
              placeholder="Search by name, user ID or email"
              ariaLabel="Search users"
              className="min-w-0 flex-1 sm:max-w-sm"
            />
            <Button
              size="sm"
              variant={showFilters ? "secondary" : "outline"}
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal className="size-4" strokeWidth={1.75} />
              Filters
              {activeFilterCount > 0 && (
                <span className="tnum ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="sky-panel animate-soft-in mt-3 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <Slicer
                label="Function"
                value={filters.functionArea}
                onChange={(v) => setFilter("functionArea", v)}
                options={opts("All functions", facet.functionArea)}
              />
              <Slicer
                label="Designation"
                value={filters.designation}
                onChange={(v) => setFilter("designation", v)}
                options={opts("All designations", facet.designation)}
              />
              <Slicer
                label="Manager"
                value={filters.manager}
                onChange={(v) => setFilter("manager", v)}
                options={opts("All managers", facet.manager)}
              />
              <Slicer
                label="Grade"
                value={filters.grade}
                onChange={(v) => setFilter("grade", v)}
                options={opts("All grades", facet.grade)}
              />
              <Slicer
                label="Location"
                value={filters.location}
                onChange={(v) => setFilter("location", v)}
                options={opts("All locations", facet.location)}
              />
              <Slicer
                label="Employee type"
                value={filters.employeeType}
                onChange={(v) => setFilter("employeeType", v)}
                options={[
                  { value: "all", label: "All types" },
                  { value: "full-time", label: "full-time" },
                  { value: "contract", label: "contract" },
                  { value: "intern", label: "intern" },
                ]}
              />
              <Slicer
                label="User status"
                value={filters.status}
                onChange={(v) => setFilter("status", v)}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "active", label: "active" },
                  { value: "invited", label: "invited" },
                  { value: "inactive", label: "inactive" },
                ]}
              />
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilters(EMPTY_USER_FILTERS);
                    setUserSearch("");
                  }}
                  disabled={activeFilterCount === 0 && !userSearch}
                >
                  <X className="size-4" strokeWidth={1.75} />
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Qualifying users — collapsed-safe (scrolls), all attributes filterable */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="tnum text-sm text-muted-foreground">
              <span className="font-[590] text-foreground">{qualifying.length}</span> qualify
              {selectedUsers.length > 0 && ` · ${selectedUsers.length} picked`}
            </p>
            <DownloadCsvButton
              slug="assignment-qualifying-users"
              disabled={qualifying.length === 0}
              headers={[
                "Name",
                "User ID",
                "Division",
                "Function",
                "Designation",
                "Manager",
                "Status",
              ]}
              rows={qualifying.map((u) => [
                u.name,
                u.userId,
                u.team,
                u.functionArea,
                u.designation,
                u.manager,
                u.userStatus,
              ])}
            />
          </div>

          {qualifying.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={Users}
                title="Nobody qualifies"
                description="Pick a team or widen the filters to see people to assign."
              />
            </div>
          ) : (
            <div className="mt-2 max-h-[420px] overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allChecked}
                        aria-label="Select all qualifying"
                        onCheckedChange={(v) =>
                          setSelectedUsers(v === true ? qualifying.map((u) => u.id) : [])
                        }
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">Division</TableHead>
                    <TableHead className="hidden lg:table-cell">Function</TableHead>
                    <TableHead className="hidden lg:table-cell">Designation</TableHead>
                    <TableHead className="hidden xl:table-cell">Manager</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qualifying.map((u) => (
                    <TableRow
                      key={u.id}
                      data-state={selectedUsers.includes(u.id) ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(u.id)}
                          aria-label={`Select ${u.name}`}
                          onCheckedChange={(v) =>
                            setSelectedUsers((prev) =>
                              v === true ? [...prev, u.id] : prev.filter((id) => id !== u.id),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-[510]">{u.name}</span>
                          {isNewJoiner(u.joiningDate) && (
                            <span className="shrink-0 rounded-[4px] bg-cat-onboarding/12 px-1.5 py-0.5 text-[10px] font-[590] text-cat-onboarding">
                              New joiner
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {u.userId}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {u.team}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {u.functionArea}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {u.designation}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                        {u.manager}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground capitalize">
                          {u.userStatus}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <p className="tnum text-sm text-muted-foreground">
              Will assign <span className="font-[590] text-foreground">{willAssignIds.length}</span>{" "}
              {willAssignIds.length === 1 ? "person" : "people"}
            </p>
            <Button onClick={submit} disabled={willAssignIds.length === 0}>
              Assign &amp; submit
            </Button>
          </div>
        </section>
      )}

      {/* Existing assignments on the previewed module */}
      {previewModuleId && (
        <section className="surface overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-card-title">Currently assigned · {resolvedModules[0]?.title}</h2>
              <p className="tnum text-xs text-muted-foreground">
                {assignments.length} assignment rows
              </p>
            </div>
            <DownloadCsvButton
              slug="admin-assignments"
              disabled={assignments.length === 0}
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
          {assignments.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nobody assigned yet"
              description="Use step 2 above to assign a team or specific people."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function opts(allLabel: string, values: string[]) {
  return [{ value: "all", label: allLabel }, ...values.map((v) => ({ value: v, label: v }))];
}

function Slicer({
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
