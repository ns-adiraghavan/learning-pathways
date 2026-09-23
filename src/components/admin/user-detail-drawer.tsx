import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Download, Pencil } from "lucide-react";
import { toast } from "sonner";

import { getUser, getUserLearningDetail, setUserModuleStatus } from "@/data/repositories";
import type { AdminUser, EnrolledStatus, UserLearningRow } from "@/data/types";
import { certificateSvg } from "@/lib/certificate";
import { downloadBlob } from "@/lib/zip";
import { slugify } from "@/lib/csv";
import type { Certificate } from "@/data/types";
import { EmptyState } from "@/components/lessons/empty-state";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: EnrolledStatus[] = ["not-started", "in-progress", "complete"];
const STATUS_LABEL: Record<EnrolledStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  complete: "Complete",
};
const STATUS_DOT: Record<EnrolledStatus, string> = {
  "not-started": "bg-muted-foreground/50",
  "in-progress": "bg-status-progress",
  complete: "bg-status-complete",
};

type RowFilter = "all" | "completed" | "pending" | "certificates";

/**
 * Full-height drawer for one person's complete learning record — shared by the
 * Users directory and the Reports (By Learner) tab. Shows everything visible on
 * that person: their attributes, and every assigned module with status, score,
 * pass/fail and certificate. The only editable thing here is a module's status.
 */
export function UserDetailDrawer({
  userId,
  onClose,
  onEditDetails,
}: {
  userId: string | null;
  onClose: () => void;
  onEditDetails?: (user: AdminUser) => void;
}) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<RowFilter>("all");

  const { data: user } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => getUser(userId!),
    enabled: !!userId,
  });
  const { data: detail, isPending } = useQuery({
    queryKey: ["admin-user-learning", userId],
    queryFn: () => getUserLearningDetail(userId!),
    enabled: !!userId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ moduleId, status }: { moduleId: string; status: EnrolledStatus }) =>
      setUserModuleStatus(userId!, moduleId, status),
    onSuccess: (res) => {
      toast.success(`Status set to ${STATUS_LABEL[res.status]}`);
      void queryClient.invalidateQueries({ queryKey: ["admin-user-learning", userId] });
    },
  });

  const rows = useMemo(() => detail?.rows ?? [], [detail]);
  const visible = useMemo(() => {
    if (filter === "completed") return rows.filter((r) => r.status === "complete");
    if (filter === "pending") return rows.filter((r) => r.status !== "complete");
    if (filter === "certificates") return rows.filter((r) => r.certificate);
    return rows;
  }, [rows, filter]);

  function downloadCertificate(r: UserLearningRow) {
    const cert: Certificate = {
      id: `${userId}-${r.moduleId}`,
      moduleId: r.moduleId,
      title: r.title,
      issuedOn: new Date().toISOString().slice(0, 10),
      credentialId: `NS-${slugify(r.title).slice(0, 10).toUpperCase()}-${user?.userId ?? ""}`,
    };
    downloadBlob(
      `certificate-${slugify(user?.name ?? "learner")}-${slugify(r.title)}.svg`,
      new Blob([certificateSvg(cert, user?.name ?? "Learner")], { type: "image/svg+xml" }),
    );
    toast.success("Certificate downloaded");
  }

  const FILTERS: { id: RowFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: detail?.assigned ?? 0 },
    { id: "completed", label: "Completed", count: detail?.completed ?? 0 },
    { id: "pending", label: "Pending", count: detail?.pending ?? 0 },
    { id: "certificates", label: "Certificates", count: detail?.certificates ?? 0 },
  ];

  return (
    <Sheet open={!!userId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b border-border">
          <SheetTitle>{user?.name ?? "Learner"}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Attributes — whatever is visible on this person */}
          <div className="border-b border-border px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {user?.userId} · {user?.userStatus}
                </p>
              </div>
              {user && onEditDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => onEditDetails(user)}
                >
                  <Pencil className="size-3.5" strokeWidth={1.75} />
                  Edit details
                </Button>
              )}
            </div>
            {user && (
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {[
                  ["Entity", user.entity],
                  ["Division", user.team],
                  ["Function", user.functionArea],
                  ["Department", user.department],
                  ["Designation", user.designation],
                  ["Location", user.location],
                  ["Manager", user.manager],
                  ["Project", user.projectName],
                  ["Employee type", user.employeeType],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-label text-muted-foreground">{label}</dt>
                    <dd className="truncate text-sm">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-2 px-4 py-3">
            {[
              { label: "Assigned", value: detail?.assigned ?? 0 },
              { label: "Completed", value: detail?.completed ?? 0 },
              { label: "Pending", value: detail?.pending ?? 0 },
              { label: "Certificates", value: detail?.certificates ?? 0 },
            ].map((s) => (
              <div key={s.label} className="surface px-3 py-2.5">
                <p className="text-label text-muted-foreground">{s.label}</p>
                <p className="tnum mt-0.5 text-lg font-[510]">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Row filter */}
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors",
                  filter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
                <span className="tnum text-xs opacity-80">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Module records */}
          <div className="px-4 pb-6">
            {isPending ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : visible.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Nothing here"
                description="No modules match this filter for this person."
              />
            ) : (
              <ul className="grid gap-2.5">
                {visible.map((r) => (
                  <li key={r.moduleId} className="surface p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-[510]">
                          <span className="truncate">{r.title}</span>
                          {r.mandatory && (
                            <span className="shrink-0 rounded-[4px] bg-cat-mandatory/12 px-1.5 py-0.5 text-[10px] font-[590] text-cat-mandatory">
                              Mandatory
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.programTitle} › {r.skillTitle}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={cn("size-1.5 rounded-full", STATUS_DOT[r.status])} />
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                      {/* Editable activity status — the only editable field here */}
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        Status
                        <Select
                          value={r.status}
                          onValueChange={(v) =>
                            statusMutation.mutate({
                              moduleId: r.moduleId,
                              status: v as EnrolledStatus,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-36" aria-label={`Status for ${r.title}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </label>

                      <span className="tnum text-xs text-muted-foreground">
                        Score:{" "}
                        <span
                          className={cn(
                            r.scorePct !== null &&
                              (r.outcome === "pass"
                                ? "text-status-complete"
                                : "text-status-overdue"),
                          )}
                        >
                          {r.scorePct === null ? "—" : `${r.scorePct}%`}
                        </span>
                      </span>

                      {r.outcome && (
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

                      {r.certificate ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-7 gap-1 px-2 text-xs text-primary"
                          onClick={() => downloadCertificate(r)}
                        >
                          <Award className="size-3.5" strokeWidth={1.75} />
                          Certificate
                          <Download className="size-3" strokeWidth={1.75} />
                        </Button>
                      ) : (
                        <span className="ml-auto text-xs text-muted-foreground">
                          No certificate
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
