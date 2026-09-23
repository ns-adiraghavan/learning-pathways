import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, SlidersHorizontal, Users, X } from "lucide-react";

import { getUsers } from "@/data/repositories";
import type { AdminUser } from "@/data/types";
import { downloadCsv, toCsv } from "@/lib/csv";
import { EmptyState } from "@/components/lessons/empty-state";
import { Button } from "@/components/ui/button";
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

/** The learner attributes the report can slice by, in display order. */
type FieldKey =
  | "functionArea"
  | "department"
  | "location"
  | "employeeType"
  | "designation"
  | "manager"
  | "projectName"
  | "entity";

const FIELDS: { key: FieldKey; label: string; allLabel: string }[] = [
  { key: "functionArea", label: "Function", allLabel: "All functions" },
  { key: "department", label: "Department", allLabel: "All departments" },
  { key: "location", label: "Location", allLabel: "All locations" },
  { key: "employeeType", label: "Employee type", allLabel: "All types" },
  { key: "designation", label: "Designation", allLabel: "All designations" },
  { key: "manager", label: "Manager", allLabel: "All managers" },
  { key: "projectName", label: "Project name", allLabel: "All projects" },
  { key: "entity", label: "Entity", allLabel: "All entities" },
];

type Selection = Partial<Record<FieldKey, string>>;

function valueOf(u: AdminUser, key: FieldKey): string {
  return String(u[key] ?? "");
}

function matches(u: AdminUser, sel: Selection, except?: FieldKey): boolean {
  return FIELDS.every(({ key }) => {
    if (key === except) return true;
    const chosen = sel[key];
    return !chosen || chosen === "all" || valueOf(u, key) === chosen;
  });
}

/**
 * Reports → By Learner Attributes.
 * Stacking, dependent slicers: each dropdown only offers values that still exist
 * once the other active filters are applied — pick "Operations" and Department
 * narrows to the departments that actually sit under it. The learner list and
 * the completion figures update live beneath.
 */
export function LearnerAttributesView() {
  const { data: users = [], isPending } = useQuery({
    queryKey: ["admin-users", "", {}],
    queryFn: () => getUsers("", {}),
  });
  const [sel, setSel] = useState<Selection>({});

  // Options for a field = distinct values among users matching every OTHER active
  // filter. That's what makes the filters dependent/stacking.
  const optionsFor = useMemo(() => {
    const map = {} as Record<FieldKey, string[]>;
    for (const { key } of FIELDS) {
      const candidates = users.filter((u) => matches(u, sel, key));
      map[key] = Array.from(new Set(candidates.map((u) => valueOf(u, key))))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    }
    return map;
  }, [users, sel]);

  const filtered = useMemo(() => users.filter((u) => matches(u, sel)), [users, sel]);

  const active = FIELDS.filter((f) => sel[f.key] && sel[f.key] !== "all");

  const setField = (key: FieldKey, value: string) =>
    setSel((prev) => {
      const next = { ...prev };
      if (value === "all") delete next[key];
      else next[key] = value;
      // Drop any now-invalid downstream selections so the view never goes empty.
      for (const { key: k } of FIELDS) {
        if (k === key) continue;
        const chosen = next[k];
        if (
          chosen &&
          !users.some((u) => matches(u, { ...next, [k]: undefined }) && valueOf(u, k) === chosen)
        ) {
          delete next[k];
        }
      }
      return next;
    });

  const completionPct = (u: AdminUser) =>
    u.assignedCount > 0 ? Math.round((u.completeCount / u.assignedCount) * 100) : 0;

  function download() {
    const csv = toCsv(
      [
        "Name",
        "Entity",
        "Function",
        "Department",
        "Location",
        "Employee type",
        "Designation",
        "Manager",
        "Project",
        "Assigned",
        "Completed",
        "Completion %",
      ],
      filtered.map((u) => [
        u.name,
        u.entity,
        u.functionArea,
        u.department,
        u.location,
        u.employeeType,
        u.designation,
        u.manager,
        u.projectName,
        u.assignedCount,
        u.completeCount,
        completionPct(u),
      ]),
    );
    downloadCsv("learners-by-attributes.csv", csv);
  }

  if (isPending) return <Skeleton className="h-80 rounded-2xl" />;

  return (
    <div className="grid gap-4">
      <section className="surface p-3 sm:p-4">
        <div className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <SlidersHorizontal className="size-4" strokeWidth={1.75} />
          Stack attributes — each filter narrows the next
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {FIELDS.map((f) => (
            <Select
              key={f.key}
              value={sel[f.key] ?? "all"}
              onValueChange={(v) => setField(f.key, v)}
            >
              <SelectTrigger className="h-9 w-full" aria-label={f.label}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{f.allLabel}</SelectItem>
                {optionsFor[f.key].map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
        {active.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {active.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setField(f.key, "all")}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-accent"
              >
                <span className="text-muted-foreground">{f.label}:</span>
                {sel[f.key]}
                <X className="size-3" strokeWidth={2} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSel({})}
              className="ml-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between gap-3">
        <p className="tnum text-sm text-muted-foreground">
          {filtered.length} learner{filtered.length === 1 ? "" : "s"} match
        </p>
        <Button variant="outline" size="sm" disabled={filtered.length === 0} onClick={download}>
          <Download className="size-4" strokeWidth={1.75} />
          Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No learners match"
          description="This combination of attributes has nobody in it. Clear a filter to widen the set."
        />
      ) : (
        <section className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="hidden sm:table-cell">Function</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="hidden lg:table-cell">Project</TableHead>
                <TableHead className="hidden sm:table-cell">Manager</TableHead>
                <TableHead className="text-right">Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 60).map((u) => {
                const pct = completionPct(u);
                return (
                  <TableRow key={u.id}>
                    <TableCell className="min-w-0">
                      <span className="block truncate text-sm font-[510]">{u.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {u.designation} · {u.location}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.entity}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {u.functionArea}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {u.department}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {u.projectName}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {u.manager}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                          <span
                            className="block h-1.5 rounded-full bg-primary"
                            style={{ width: `${Math.max(3, pct)}%` }}
                          />
                        </span>
                        <span className="tnum w-9 text-right text-sm text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length > 60 && (
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Showing first 60 of {filtered.length}. Export the CSV for the full set.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
