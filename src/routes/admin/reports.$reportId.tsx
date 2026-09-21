import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarClock, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { getReport } from "@/data/repositories";
import { DEPARTMENTS, LOCATIONS } from "@/data/admin-mocks";
import type { ReportFilters, ReportId } from "@/data/types";
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
import { cn } from "@/lib/utils";
import { DownloadCsvButton } from "@/components/download-csv-button";

export const Route = createFileRoute("/admin/reports/$reportId")({
  head: () => ({
    meta: [
      { title: "Report — Lessons Admin" },
      { name: "description", content: "Filterable learning report with export and scheduling." },
      { property: "og:title", content: "Report — Lessons Admin" },
      {
        property: "og:description",
        content: "Filterable learning report with export and scheduling.",
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
  const [filters, setFilters] = useState<ReportFilters>({
    period: "90d",
    department: "all",
    location: "all",
  });

  const { data: report, isPending } = useQuery({
    queryKey: ["admin-report", reportId, filters],
    queryFn: () => getReport(reportId as ReportId, filters),
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/admin/reports"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={1.75} />
        Reports
      </Link>

      <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-title">{report?.name ?? "Report"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{report?.description}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={() => toast.success("Report scheduled")}>
            <CalendarClock className="size-4" strokeWidth={1.75} />
            Schedule
          </Button>
          <DownloadCsvButton
            slug={`report-${reportId}`}
            headers={report?.columns.map((column) => column.label) ?? []}
            rows={report?.rows.map((row) => report.columns.map((column) => row[column.key] ?? "")) ?? []}
          />
        </div>
      </header>

      <div className="surface mb-4 flex flex-wrap gap-3 p-3">
        <Select
          value={filters.period}
          onValueChange={(v) => setFilters({ ...filters, period: v as ReportFilters["period"] })}
        >
          <SelectTrigger className="w-40" aria-label="Time period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.department}
          onValueChange={(v) => setFilters({ ...filters, department: v })}
        >
          <SelectTrigger className="w-44" aria-label="Department">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.location}
          onValueChange={(v) => setFilters({ ...filters, location: v })}
        >
          <SelectTrigger className="w-40" aria-label="Location">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {LOCATIONS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : !report || report.rows.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No results"
          description="Nothing matches these filters. Widen the period or clear a filter."
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
  );
}
