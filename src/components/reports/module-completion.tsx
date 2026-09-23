import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, BarChart3, Download, FileText, Layers } from "lucide-react";
import { toast } from "sonner";

import { getAssignableModules, getModuleCompletion } from "@/data/repositories";
import type { AssignableModule, ModuleCompletionRow } from "@/data/types";
import { certificateSvg } from "@/lib/certificate";
import { createZip, downloadBlob } from "@/lib/zip";
import type { Certificate } from "@/data/types";
import { downloadCsv, slugify, toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
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

type StatusFilter = "all" | "complete" | "in-progress" | "not-started";

const STATUS_LABEL: Record<ModuleCompletionRow["status"], string> = {
  complete: "Completed",
  "in-progress": "In progress",
  "not-started": "Not started",
};

/**
 * Reports → Completion → By Modules.
 * Drill Program → Skill → Module, then see the connected completion detail for
 * that one module: per-learner scores, pass/fail, completed-on and certificate
 * downloads — the view that used to live only under Mandatory Quizzes.
 */
export function ModuleCompletionView() {
  const { data: modules = [], isPending: modulesPending } = useQuery({
    queryKey: ["assignable-modules"],
    queryFn: getAssignableModules,
  });

  const [program, setProgram] = useState("all");
  const [skill, setSkill] = useState("all");
  const [moduleId, setModuleId] = useState<string | null>(null);

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
  const candidates = useMemo(
    () =>
      modules.filter(
        (m) =>
          (program === "all" || m.programTitle === program) &&
          (skill === "all" || m.skillTitle === skill),
      ),
    [modules, program, skill],
  );

  if (modulesPending) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <div className="grid gap-4">
      {/* Program → Skill picker. A module must be chosen to see its detail. */}
      <div className="surface flex flex-wrap items-center gap-2 p-3">
        <span className="mr-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Layers className="size-4" strokeWidth={1.75} />
          Drill to a module:
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
            <SelectValue placeholder="Pick a module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Pick a module…</SelectItem>
            {candidates.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {moduleId ? (
        <ModuleDetail moduleId={moduleId} />
      ) : (
        <ModulePicklist candidates={candidates} onPick={setModuleId} />
      )}
    </div>
  );
}

/** When no module is chosen yet, list the candidate modules to pick from. */
function ModulePicklist({
  candidates,
  onPick,
}: {
  candidates: AssignableModule[];
  onPick: (id: string) => void;
}) {
  if (candidates.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No modules here"
        description="No modules match this program/skill. Widen the selection above."
      />
    );
  }
  return (
    <section className="surface overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-card-title">Pick a module</h2>
        <p className="text-xs text-muted-foreground">
          Select one to see per-learner scores, pass/fail and certificates.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {candidates.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onPick(m.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-[510]">{m.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {m.programTitle} › {m.skillTitle}
                </span>
              </span>
              <span className="tnum shrink-0 text-xs text-muted-foreground">
                {m.assignedCount} enrolled
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ModuleDetail({ moduleId }: { moduleId: string }) {
  const { data, isPending } = useQuery({
    queryKey: ["module-completion", moduleId],
    queryFn: () => getModuleCompletion(moduleId),
  });
  const [status, setStatus] = useState<StatusFilter>("all");
  const [entity, setEntity] = useState("all");

  const rows = useMemo(() => data?.rows ?? [], [data]);
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
  if (!data)
    return (
      <EmptyState
        icon={BarChart3}
        title="No data"
        description="This module has no completion data yet."
      />
    );

  const { meta } = data;

  function downloadRows() {
    const csv = toCsv(
      [
        "Name",
        "Email",
        "Team",
        "Entity",
        "Status",
        "Score %",
        "Result",
        "Completed on",
        "Attempts",
        "Certificate",
      ],
      visible.map((r) => [
        r.name,
        r.email,
        r.team,
        r.entity,
        STATUS_LABEL[r.status],
        r.scorePct ?? "",
        r.outcome ? (r.outcome === "pass" ? "Pass" : "Fail") : "",
        r.completedOn ?? "",
        r.attempts,
        r.certificate ? "Yes" : "No",
      ]),
    );
    downloadCsv(`completion-${slugify(meta.moduleTitle)}.csv`, csv);
  }

  function downloadCertificate(r: ModuleCompletionRow) {
    const cert: Certificate = {
      id: r.learnerId,
      moduleId: meta.moduleId,
      title: meta.moduleTitle,
      issuedOn: r.completedOn ?? new Date().toISOString().slice(0, 10),
      credentialId: `NS-${slugify(meta.moduleTitle).slice(0, 10).toUpperCase()}-${r.userId}`,
    };
    const svg = certificateSvg(cert, r.name);
    downloadBlob(`certificate-${slugify(r.name)}.svg`, new Blob([svg], { type: "image/svg+xml" }));
    toast.success(`Certificate downloaded for ${r.name}`);
  }

  function downloadAllCertificates() {
    if (certifiable.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const zip = createZip(
      certifiable.map((r) => {
        const cert: Certificate = {
          id: r.learnerId,
          moduleId: meta.moduleId,
          title: meta.moduleTitle,
          issuedOn: r.completedOn ?? today,
          credentialId: `NS-${slugify(meta.moduleTitle).slice(0, 10).toUpperCase()}-${r.userId}`,
        };
        return {
          name: `certificate-${slugify(r.name)}.svg`,
          content: certificateSvg(cert, r.name),
        };
      }),
    );
    downloadBlob(`certificates-${slugify(meta.moduleTitle)}-${today}.zip`, zip);
    toast.success(
      `Downloaded ${certifiable.length} certificate${certifiable.length === 1 ? "" : "s"}`,
    );
  }

  return (
    <div className="grid gap-4">
      {/* Module header + KPIs */}
      <section className="surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-card-title">{meta.moduleTitle}</h2>
              {meta.mandatory && (
                <span className="shrink-0 rounded-[4px] bg-cat-mandatory/12 px-1.5 py-0.5 text-[10px] font-[590] text-cat-mandatory">
                  Mandatory
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {meta.programTitle} › {meta.skillTitle} · Pass mark {meta.passMarkPct}% · Due{" "}
              {formatDate(meta.dueDate)}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Enrolled" value={`${meta.enrolled}`} tint="var(--chart-2)" />
          <Kpi label="Completed" value={`${meta.completed}`} tint="var(--status-complete)" />
          <Kpi label="Completion" value={`${meta.completionPct}%`} tint="var(--chart-1)" />
          <Kpi label="Pass rate" value={`${meta.passRatePct}%`} tint="var(--chart-4)" />
        </div>
      </section>

      {/* Controls */}
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
          <Button
            variant="outline"
            size="sm"
            disabled={visible.length === 0}
            onClick={downloadRows}
          >
            <Download className="size-4" strokeWidth={1.75} />
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={certifiable.length === 0}
            onClick={downloadAllCertificates}
            title={
              meta.hasCertificate
                ? "Download certificates for everyone who passed"
                : "This module doesn't issue certificates"
            }
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
          description="No learners match this filter."
        />
      ) : (
        <section className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Team</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden text-right md:table-cell">Completed on</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Result</TableHead>
                <TableHead className="text-right">Certificate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={r.learnerId}>
                  <TableCell className="min-w-0">
                    <span className="block truncate text-sm font-[510]">{r.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.email}</span>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {r.team}
                  </TableCell>
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
                  <TableCell className="tnum hidden text-right text-xs text-muted-foreground md:table-cell">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs text-primary"
                        onClick={() => downloadCertificate(r)}
                      >
                        <Download className="size-3.5" strokeWidth={1.75} />
                        Download
                      </Button>
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
