import { useState } from "react";
import { Sparkles } from "lucide-react";

import { generateCustomReport } from "@/data/repositories";
import type { ReportDetail, ReportId } from "@/data/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DownloadCsvButton } from "@/components/download-csv-button";
import { cn } from "@/lib/utils";

const BASES: { value: ReportId; label: string }[] = [
  { value: "completion-ratio", label: "Completion Ratio" },
  { value: "time-spent", label: "Time Spent" },
  { value: "leaderboard-points", label: "Leaderboard Points" },
  { value: "login", label: "Login Activity" },
];

const GROUP_BY = ["Learner", "Team", "Program", "Module"];

/**
 * Custom report builder (pointer 8) — the interface only. The admin picks a base
 * dataset, an optional keyword, and a grouping; the server owns the real query
 * engine. Generated fields become toggles to narrow the preview.
 */
export function CustomReportBuilder() {
  const [open, setOpen] = useState(false);
  const [base, setBase] = useState<ReportId>("completion-ratio");
  const [keyword, setKeyword] = useState("");
  const [groupBy, setGroupBy] = useState("Learner");
  const [result, setResult] = useState<ReportDetail | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    const r = await generateCustomReport({ base, keyword, fields: [], groupBy });
    setResult(r);
    setHidden([]);
    setBusy(false);
  };

  const visibleColumns = result?.columns.filter((c) => !hidden.includes(c.key)) ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setResult(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Sparkles className="size-4" strokeWidth={1.75} />
          Build custom report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Custom report builder</DialogTitle>
          <DialogDescription>
            Pick a dataset and grouping, add an optional keyword, then generate a preview.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Dataset</Label>
            <Select value={base} onValueChange={(v) => setBase(v as ReportId)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASES.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Group by</Label>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_BY.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Keyword (optional)</Label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. a team or name"
              className="h-9"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => void generate()} disabled={busy}>
            {busy ? "Generating…" : "Generate report"}
          </Button>
        </div>

        {result && (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Fields:</span>
              {result.columns.map((c) => {
                const on = !hidden.includes(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() =>
                      setHidden((prev) =>
                        prev.includes(c.key) ? prev.filter((k) => k !== c.key) : [...prev, c.key],
                      )
                    }
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                      on
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
              <div className="ml-auto">
                <DownloadCsvButton
                  slug={`custom-${result.id}`}
                  headers={visibleColumns.map((c) => c.label)}
                  rows={result.rows.map((row) => visibleColumns.map((c) => row[c.key] ?? ""))}
                />
              </div>
            </div>

            <div className="surface max-h-72 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.map((c) => (
                      <TableHead key={c.key} className={cn(c.numeric && "text-right")}>
                        {c.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row, i) => (
                    <TableRow key={i}>
                      {visibleColumns.map((c) => (
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
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
