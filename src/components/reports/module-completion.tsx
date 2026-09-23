import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, BarChart3, Download, FileText, Layers, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { getAssignableModules, getCompletionRecords } from "@/data/repositories";
import type { AssignableModule, CompletionRecord, CompletionScope } from "@/data/types";
import { certificateSvg } from "@/lib/certificate";
import { createZip, downloadBlob } from "@/lib/zip";
import type { Certificate } from "@/data/types";
import { downloadCsv, slugify, toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/lessons/empty-state";
import { UserDetailDrawer } from "@/components/admin/user-detail-drawer";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/ui/search-box";
import { Switch } from "@/components/ui/switch";
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

type StatusFilter = "all" | "complete" | "in-progress" | "not-started";

const STATUS_LABEL: Record<CompletionRecord["status"], string> = {
  complete: "Completed",
  "in-progress": "In progress",
  "not-started": "Not started",
};

/**
 * Reports → Completion → By Modules.
 * Search or drill Program → Skill → Module, then see completion records for that
 * scope: every learner × module with status, score, pass/fail, completed-on and
 * certificate. A "mandatory only" switch narrows to compliance-tracked modules.
 * Clicking a learner opens their full record in the shared drawer.
 */
export function ModuleCompletionView() {
  const { data: modules = [], isPending: modulesPending } = useQuery({
    queryKey: ["assignable-modules"],
    queryFn: getAssignableModules,
  });

  const [program, setProgram] = useState("all");
  const [skill, setSkill] = useState("all");
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [mandatoryOnly, setMandatoryOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [openLearner, setOpenLearner] = useState<string | null>(null);

  const programs = useMemo(
    () => Array.from(new Set(modules.map((m) => m.programTitle))).sort(),
    [modules],
  );
  const skills = useMemo(
    () =>
      Array.from(
        new Set(
          modules
            .filter((m) => program === "all" || m.programTitle === program)
            .map((m) => m.skillTitle),
        ),
      ).sort(),
    [modules, program],
  );

  const q = search.trim().toLowerCase();
  const candidates = useMemo(
    () =>
      modules.filter(
        (m) =>
          (program === "all" || m.programTitle === program) &&
          (skill === "all" || m.skillTitle === skill) &&
          (!q ||
            m.title.toLowerCase().includes(q) ||
            m.skillTitle.toLowerCase().includes(q) ||
            m.programTitle.toLowerCase().includes(q)),
      ),
    [modules, program, skill, q],
  );

  const hasScope = program !== "all" || skill !== "all" || moduleId !== null;
  const scope: CompletionScope = {
    programTitle: program === "all" ? undefined : program,
    skillTitle: skill === "all" ? undefined : skill,
    moduleId: moduleId ?? undefined,
    mandatoryOnly,
  };

  if (modulesPending) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <div className="grid gap-4">
      {/* Picker: search + drill selects + mandatory-only switch */}
      <div className="surface grid gap-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Layers className="size-4" strokeWidth={1.75} />
            Scope:
          </span>
          <Select
            value={program}
            onValueChange={(v) => {
              setProgram(v);
              setSkill("all");
              setModuleId(null);
            }}
          >
            <SelectTrigger className="h-9 w-auto min-w-40" aria-label="Program">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={skill}
            onValueChange={(v) => {
              setSkill(v);
              setModuleId(null);
            }}
          >
            <SelectTrigger className="h-9 w-auto min-w-40" aria-label="Skill">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All skills</SelectItem>
              {skills.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={moduleId ?? "none"}
            onValueChange={(v) => setModuleId(v === "none" ? null : v)}
          >
            <SelectTrigger className="h-9 w-auto min-w-56" aria-label="Module">
              <SelectValue placeholder="Whole scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Whole scope (all modules)</SelectItem>
              {candidates.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="ml-auto flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm">
            <ShieldCheck className="size-4 text-cat-mandatory" strokeWidth={1.75} />
            <span className="text-muted-foreground">Mandatory only</span>
            <Switch checked={mandatoryOnly} onCheckedChange={setMandatoryOnly} />
          </label>
        </div>
        {(program !== "all" || skill !== "all" || moduleId) && (
          <button
            type="button"
            onClick={() => {
              setProgram("all");
              setSkill("all");
              setModuleId(null);
            }}
            className="w-fit text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            ← Clear scope
          </button>
        )}
      </div>

      {hasScope ? (
        <RecordsDetail scope={scope} onOpenLearner={setOpenLearner} />
      ) : (
        <ModulePicklist
          candidates={candidates}
          search={search}
          onSearch={setSearch}
          onPick={setModuleId}
          onPickProgram={setProgram}
        />
      )}

      <UserDetailDrawer userId={openLearner} onClose={() => setOpenLearner(null)} />
    </div>
  );
}

/** With no scope chosen yet, search and pick a program or a module to drill into. */
function ModulePicklist({
  candidates,
  search,
  onSearch,
  onPick,
  onPickProgram,
}: {
  candidates: AssignableModule[];
  search: string;
  onSearch: (v: string) => void;
  onPick: (id: string) => void;
  onPickProgram: (p: string) => void;
}) {
  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-card-title">Pick a program, skill or module</h2>
          <p className="text-xs text-muted-foreground">
            Search across hundreds of items, or use the selects above to scope.
          </p>
        </div>
        <SearchBox
          value={search}
          onChange={onSearch}
          placeholder="Search program, skill or module"
          className="w-full sm:w-72"
        />
      </div>
      {candidates.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No matches"
          description="Nothing matches this search. Try a different term."
        />
      ) : (
        <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto">
          {candidates.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPick(m.id)}
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-[510]">{m.title}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPickProgram(m.programTitle);
                    }}
                    className="block truncate text-left text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    {m.programTitle} › {m.skillTitle}
                  </button>
                </span>
                <span className="tnum shrink-0 text-xs text-muted-foreground">
                  {m.assignedCount} enrolled
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecordsDetail({
  scope,
  onOpenLearner,
}: {
  scope: CompletionScope;
  onOpenLearner: (userId: string) => void;
}) {
  const { data, isPending } = useQuery({
    queryKey: ["completion-records", scope],
    queryFn: () => getCompletionRecords(scope),
  });
  const [status, setStatus] = useState<StatusFilter>("all");
  const [entity, setEntity] = useState("all");

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const singleModule = !!scope.moduleId;
  const entities = useMemo(() => Array.from(new Set(rows.map((r) => r.entity))).sort(), [rows]);
  const visible = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status === "all" || r.status === status) && (entity === "all" || r.entity === entity),
      ),
    [rows, status, entity],
  );
  const certifiable = useMemo(() => visible.filter((r) => r.certificate), [visible]);

  if (isPending) return <Skeleton className="h-80 rounded-2xl" />;
  if (!data || rows.length === 0)
    return (
      <EmptyState
        icon={BarChart3}
        title="No records"
        description="Nothing matches this scope. Widen it or turn off the mandatory-only filter."
      />
    );

  function download() {
    const csv = toCsv(
      [
        "Learner",
        "Module",
        "Program",
        "Skill",
        "Entity",
        "Mandatory",
        "Status",
        "Score %",
        "Result",
        "Completed on",
        "Certificate",
      ],
      visible.map((r) => [
        r.name,
        r.moduleTitle,
        r.programTitle,
        r.skillTitle,
        r.entity,
        r.mandatory ? "Yes" : "No",
        STATUS_LABEL[r.status],
        r.scorePct ?? "",
        r.outcome ? (r.outcome === "pass" ? "Pass" : "Fail") : "",
        r.completedOn ?? "",
        r.certificate ? "Yes" : "No",
      ]),
    );
    downloadCsv(`completion-${slugify(data!.scopeLabel)}.csv`, csv);
  }

  function downloadAllCertificates() {
    if (certifiable.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const zip = createZip(
      certifiable.map((r) => {
        const cert: Certificate = {
          id: `${r.userId}-${r.moduleId}`,
          moduleId: r.moduleId,
          title: r.moduleTitle,
          issuedOn: r.completedOn ?? today,
          credentialId: `NS-${slugify(r.moduleTitle).slice(0, 10).toUpperCase()}-${r.userId}`,
        };
        return {
          name: `certificate-${slugify(r.name)}-${slugify(r.moduleTitle)}.svg`,
          content: certificateSvg(cert, r.name),
        };
      }),
    );
    downloadBlob(`certificates-${slugify(data!.scopeLabel)}-${today}.zip`, zip);
    toast.success(
      `Downloaded ${certifiable.length} certificate${certifiable.length === 1 ? "" : "s"}`,
    );
  }

  return (
    <div className="grid gap-4">
      <section className="surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="truncate text-card-title">{data.scopeLabel}</h2>
          <span className="tnum text-xs text-muted-foreground">
            {data.moduleCount} module{data.moduleCount === 1 ? "" : "s"} in scope
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Kpi label="Records" value={`${data.enrolled}`} tint="var(--chart-2)" />
          <Kpi label="Completed" value={`${data.completed}`} tint="var(--status-complete)" />
          <Kpi label="Completion" value={`${data.completionPct}%`} tint="var(--chart-1)" />
          <Kpi label="Pass rate" value={`${data.passRatePct}%`} tint="var(--chart-4)" />
          <Kpi label="Certificates" value={`${data.certificates}`} tint="var(--chart-3)" />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-border p-0.5">
          {(["all", "complete", "in-progress", "not-started"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatus(f)}
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors",
                status === f
                  ? "bg-accent font-[510] text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "All" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger className="h-9 w-36" aria-label="Filter by entity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entities.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={visible.length === 0} onClick={download}>
            <Download className="size-4" strokeWidth={1.75} />
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={certifiable.length === 0}
            onClick={downloadAllCertificates}
          >
            <Award className="size-4" strokeWidth={1.75} />
            Certificates ({certifiable.length})
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Nobody here"
          description="No records match this filter."
        />
      ) : (
        <section className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                {!singleModule && <TableHead className="hidden md:table-cell">Module</TableHead>}
                <TableHead>Entity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Completed on</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Result</TableHead>
                <TableHead className="text-right">Certificate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={`${r.learnerId}-${r.moduleId}`}>
                  <TableCell className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenLearner(r.learnerId)}
                      className="block max-w-[180px] truncate text-left text-sm font-[510] hover:text-primary"
                    >
                      {r.name}
                    </button>
                    <span className="block truncate text-xs text-muted-foreground">{r.team}</span>
                  </TableCell>
                  {!singleModule && (
                    <TableCell className="hidden max-w-[180px] truncate text-sm text-muted-foreground md:table-cell">
                      {r.moduleTitle}
                    </TableCell>
                  )}
                  <TableCell className="text-sm text-muted-foreground">{r.entity}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          r.status === "complete"
                            ? "bg-status-complete"
                            : r.status === "in-progress"
                              ? "bg-status-progress"
                              : "bg-muted-foreground/50",
                        )}
                      />
                      {STATUS_LABEL[r.status]}
                    </span>
                  </TableCell>
                  <TableCell className="tnum hidden text-right text-xs text-muted-foreground lg:table-cell">
                    {r.completedOn ? formatDate(r.completedOn) : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "tnum text-right text-sm",
                      r.scorePct !== null &&
                        (r.outcome === "pass" ? "text-status-complete" : "text-status-overdue"),
                    )}
                  >
                    {r.scorePct === null ? "—" : `${r.scorePct}%`}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.outcome === null ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-[590]",
                          r.outcome === "pass"
                            ? "bg-status-complete/12 text-status-complete"
                            : "bg-status-overdue/12 text-status-overdue",
                        )}
                      >
                        {r.outcome === "pass" ? "Pass" : "Fail"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.certificate ? (
                      <span className="inline-flex items-center gap-1 text-xs text-status-complete">
                        <Award className="size-3.5" strokeWidth={1.75} />
                        Earned
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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

function Kpi({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div className="soft-tile rounded-xl px-4 py-3" style={{ ["--tile-tint" as string]: tint }}>
      <p className="text-label text-muted-foreground">{label}</p>
      <p className="tnum mt-0.5 text-xl font-[510]">{value}</p>
    </div>
  );
}
