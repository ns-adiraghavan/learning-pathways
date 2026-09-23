import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarClock, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { getReport } from "@/data/repositories";
import {
  DEPARTMENTS,
  DESIGNATIONS,
  ENTITIES_LIST,
  FUNCTIONS,
  LOCATIONS,
  MANAGERS,
  PROGRAMS,
  REPORT_TABS,
  TEAMS,
} from "@/data/admin-mocks";
import type { ReportFilters, ReportId, ReportTab } from "@/data/types";
import { EmptyState } from "@/components/lessons/empty-state";
import { KpiRow, ReportChartCard } from "@/components/reports/report-charts";
import { ModuleCompletionView } from "@/components/reports/module-completion";
import { LearnerAttributesView } from "@/components/reports/attribute-filters";
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
import { cn } from "@/lib/utils";
import { DownloadCsvButton } from "@/components/download-csv-button";

export const Route = createFileRoute("/admin/reports/$reportId")({
  head: () => ({
    meta: [
      { title: "Report — Lessons Admin" },
      { name: "description", content: "Filterable learning report with tabs, charts and export." },
      { property: "og:title", content: "Report — Lessons Admin" },
      {
        property: "og:description",
        content: "Filterable learning report with tabs, charts and export.",
      },
    ],
  }),
  component: ReportDetailPage,
});

const PERIODS: { value: ReportFilters["period"]; label: string }[] = [
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

function ReportDetailPage() {
  const { reportId } = Route.useParams();
  const [tab, setTab] = useState<ReportTab>("dashboard");
  const [filters, setFilters] = useState<ReportFilters>({
    period: "90d",
    department: "all",
    location: "all",
    team: "all",
    program: "all",
    functionArea: "all",
    designation: "all",
    manager: "all",
    status: "all",
  });

  const isCompletion = reportId === "completion-ratio";
  // The completion report drives these two tabs with dedicated, connected views:
  // By Modules → per-module scores / pass-fail / certificates; By Learner
  // Attributes → stacking dependent slicers over the learner directory.
  const moduleView = isCompletion && tab === "by-modules";
  const attrView = isCompletion && tab === "by-attributes";
  const customView = moduleView || attrView;

  const { data: report, isPending } = useQuery({
    queryKey: ["admin-report", reportId, tab, filters],
    queryFn: () => getReport(reportId as ReportId, { ...filters, tab }),
    enabled: !customView,
  });

  const exportHeaders = report?.columns.map((c) => c.label) ?? [];
  const exportRows = report?.rows.map((row) => report.columns.map((c) => row[c.key] ?? "")) ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/admin/reports"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={1.75} />
        Reports
      </Link>

      <header className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-title">{report?.name ?? "Report"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{report?.description}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={() => toast.success("Report scheduled")}>
            <CalendarClock className="size-4" strokeWidth={1.75} />
            Schedule
          </Button>
          {!customView && (
            <DownloadCsvButton
              slug={`report-${reportId}-${tab}`}
              headers={exportHeaders}
              rows={exportRows}
            />
          )}
        </div>
      </header>

      {/* Tab set */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {REPORT_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "relative shrink-0 px-3 py-2 text-sm transition-colors",
              tab === t.value
                ? "font-[510] text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {tab === t.value && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Completion → By Modules / By Learner Attributes carry their own filters. */}
      {moduleView && <ModuleCompletionView />}
      {attrView && <LearnerAttributesView />}

      {/* Slicers (all other tabs / reports) */}
      {!customView && (
        <div className="surface mb-4 flex flex-wrap gap-2 p-3">
          <SlicerSelect
            value={filters.period}
            onChange={(v) => setFilters({ ...filters, period: v as ReportFilters["period"] })}
            label="Time period"
            options={PERIODS}
          />
          <SlicerSelect
            value={filters.team ?? "all"}
            onChange={(v) => setFilters({ ...filters, team: v })}
            label="Team"
            options={[
              { value: "all", label: "All teams" },
              ...TEAMS.map((t) => ({ value: t, label: t })),
            ]}
          />
          <SlicerSelect
            value={filters.program ?? "all"}
            onChange={(v) => setFilters({ ...filters, program: v })}
            label="Program"
            options={[
              { value: "all", label: "All programs" },
              ...PROGRAMS.map((p) => ({ value: p, label: p })),
            ]}
          />
          <SlicerSelect
            value={filters.department}
            onChange={(v) => setFilters({ ...filters, department: v })}
            label="Department"
            options={[
              { value: "all", label: "All departments" },
              ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
            ]}
          />
          <SlicerSelect
            value={filters.location}
            onChange={(v) => setFilters({ ...filters, location: v })}
            label="Location"
            options={[
              { value: "all", label: "All locations" },
              ...LOCATIONS.map((l) => ({ value: l, label: l })),
            ]}
          />
          <SlicerSelect
            value={filters.functionArea ?? "all"}
            onChange={(v) => setFilters({ ...filters, functionArea: v })}
            label="Function"
            options={[
              { value: "all", label: "All functions" },
              ...FUNCTIONS.map((f) => ({ value: f, label: f })),
            ]}
          />
          <SlicerSelect
            value={filters.designation ?? "all"}
            onChange={(v) => setFilters({ ...filters, designation: v })}
            label="Designation"
            options={[
              { value: "all", label: "All designations" },
              ...DESIGNATIONS.map((d) => ({ value: d, label: d })),
            ]}
          />
          <SlicerSelect
            value={filters.manager ?? "all"}
            onChange={(v) => setFilters({ ...filters, manager: v })}
            label="Manager"
            options={[
              { value: "all", label: "All managers" },
              ...MANAGERS.map((m) => ({ value: m, label: m })),
            ]}
          />
          <SlicerSelect
            value={filters.entity ?? "all"}
            onChange={(v) => setFilters({ ...filters, entity: v })}
            label="Entity"
            options={[
              { value: "all", label: "All entities" },
              ...ENTITIES_LIST.map((e) => ({ value: e, label: e })),
            ]}
          />
        </div>
      )}

      {!customView &&
        (isPending ? (
          <div className="grid gap-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : !report ? (
          <EmptyState
            icon={BarChart3}
            title="No results"
            description="Nothing matches these filters. Widen the period or clear a filter."
          />
        ) : (
          <div className="grid gap-4">
            {report.kpis && report.kpis.length > 0 && <KpiRow kpis={report.kpis} />}

            {report.charts && report.charts.length > 0 && (
              <div className={cn("grid gap-4", report.charts.length > 1 && "lg:grid-cols-2")}>
                {report.charts.map((chart) => (
                  <ReportChartCard key={chart.title} chart={chart} />
                ))}
              </div>
            )}

            {report.rows.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No rows"
                description="This slice has no data for the current filters."
              />
            ) : (
              <section className="surface overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {report.columns.map((c) => (
                        <TableHead key={c.key} className={cn(c.numeric && "text-right")}>
                          {c.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.rows.map((row, i) => (
                      <TableRow key={i}>
                        {report.columns.map((c) => (
                          <TableCell
                            key={c.key}
                            className={cn("text-sm", c.numeric && "tnum text-right")}
                          >
                            {row[c.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            )}
          </div>
        ))}
    </div>
  );
}

function SlicerSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-36" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
