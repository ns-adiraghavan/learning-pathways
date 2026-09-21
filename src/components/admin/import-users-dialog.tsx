import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileSpreadsheet, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { addUser } from "@/data/repositories";
import type { AdminRole, EmployeeType } from "@/data/types";
import { downloadCsv } from "@/lib/csv";
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
import { cn } from "@/lib/utils";

const SAMPLE_HEADERS = [
  "name",
  "email",
  "team",
  "role",
  "department",
  "location",
  "designation",
  "employeeType",
  "function",
  "grade",
  "manager",
];

const SAMPLE_ROWS = [
  [
    "Asha Menon",
    "asha.menon@netscribes.com",
    "Research Delivery",
    "Learner",
    "Research",
    "Noida",
    "Analyst",
    "full-time",
    "Delivery",
    "G1",
    "Ananya Rao",
  ],
  [
    "Dev Patel",
    "dev.patel@netscribes.com",
    "Technology",
    "Trainer",
    "Technology",
    "Bengaluru",
    "Team Lead",
    "full-time",
    "Engineering",
    "G3",
    "Vikram Iyer",
  ],
];

const VALID_ROLES: AdminRole[] = ["Learner", "Trainer", "Administrator"];
const VALID_TYPES: EmployeeType[] = ["full-time", "contract", "intern"];

interface ParsedRow {
  line: number;
  name: string;
  email: string;
  team: string;
  role: AdminRole;
  department?: string | undefined;
  location?: string | undefined;
  designation?: string | undefined;
  employeeType?: EmployeeType | undefined;
  functionArea?: string | undefined;
  grade?: string | undefined;
  manager?: string | undefined;
  error?: string | undefined;
}

/** Split a single CSV line, honouring simple double-quoted cells. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name.toLowerCase());
  const col = { name: idx("name"), email: idx("email"), team: idx("team"), role: idx("role") };

  return lines.slice(1).map((line, i): ParsedRow => {
    const cells = splitCsvLine(line);
    const get = (name: string) => {
      const at = idx(name);
      return at >= 0 ? (cells[at] ?? "").trim() : "";
    };
    const name = col.name >= 0 ? (cells[col.name] ?? "").trim() : "";
    const email = col.email >= 0 ? (cells[col.email] ?? "").trim() : "";
    const team = col.team >= 0 ? (cells[col.team] ?? "").trim() : "";
    const roleRaw = (col.role >= 0 ? (cells[col.role] ?? "").trim() : "") || "Learner";
    const role = VALID_ROLES.find((r) => r.toLowerCase() === roleRaw.toLowerCase()) ?? "Learner";
    const typeRaw = get("employeeType").toLowerCase();
    const employeeType = VALID_TYPES.find((t) => t === typeRaw);

    let error: string | undefined;
    if (!name) error = "Missing name";
    else if (!email) error = "Missing email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = "Invalid email";

    return {
      line: i + 2,
      name,
      email,
      team,
      role,
      department: get("department") || undefined,
      location: get("location") || undefined,
      designation: get("designation") || undefined,
      employeeType,
      functionArea: get("function") || undefined,
      grade: get("grade") || undefined,
      manager: get("manager") || undefined,
      error,
    };
  });
}

export function ImportUsersDialog() {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const valid = rows?.filter((r) => !r.error) ?? [];
  const errors = rows?.filter((r) => r.error) ?? [];

  const reset = () => {
    setFileName(null);
    setRows(null);
    setDragging(false);
  };

  const readFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setRows(parseCsv(String(reader.result ?? "")));
    reader.readAsText(file);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      for (const r of valid) {
        // CONNECT: a real import posts the file to the server for validation +
        // ingest; here we add valid rows one at a time via addUser.
        await addUser({
          name: r.name,
          email: r.email,
          team: r.team,
          role: r.role,
          department: r.department,
          location: r.location,
          designation: r.designation,
          employeeType: r.employeeType,
          functionArea: r.functionArea,
          grade: r.grade,
          manager: r.manager,
        });
      }
      return valid.length;
    },
    onSuccess: (count) => {
      toast.success(`Imported ${count} ${count === 1 ? "user" : "users"}`);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
      reset();
    },
  });

  const downloadSample = () => downloadCsv("lessons-users-import-sample.csv", buildSampleCsv());

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="shrink-0">
          <Upload className="size-4" strokeWidth={1.75} />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import users</DialogTitle>
          <DialogDescription>
            Upload a CSV to bulk-add people. Not sure of the columns? Download the sample first.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) readFile(file);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-input hover:border-primary/50",
          )}
        >
          <FileSpreadsheet className="size-6 text-primary" strokeWidth={1.5} />
          <span className="text-sm font-[510]">
            {fileName ?? "Drop a CSV here, or click to choose"}
          </span>
          <span className="text-xs text-muted-foreground">.csv up to a few thousand rows</span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFile(file);
            }}
          />
        </button>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={downloadSample}
            className="text-xs font-[510] text-primary hover:underline"
          >
            Download sample CSV
          </button>
          {rows && (
            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted-foreground hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {rows && (
          <div className="grid gap-2 rounded-lg border border-border p-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-status-complete" strokeWidth={1.75} />
              <span className="tnum font-[510]">{valid.length} rows ready</span>
              {errors.length > 0 && (
                <span className="tnum ml-auto inline-flex items-center gap-1.5 text-destructive">
                  <X className="size-4" strokeWidth={2} />
                  {errors.length} with errors
                </span>
              )}
            </div>
            {errors.length > 0 && (
              <ul className="tnum max-h-28 overflow-y-auto text-xs text-muted-foreground">
                {errors.slice(0, 12).map((r) => (
                  <li key={r.line}>
                    Row {r.line}: {r.error}
                    {r.email ? ` (${r.email})` : ""}
                  </li>
                ))}
                {errors.length > 12 && <li>…and {errors.length - 12} more</li>}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={valid.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Importing…" : `Import ${valid.length || ""} users`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildSampleCsv(): string {
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [SAMPLE_HEADERS, ...SAMPLE_ROWS].map((r) => r.map(escape).join(",")).join("\n");
}
