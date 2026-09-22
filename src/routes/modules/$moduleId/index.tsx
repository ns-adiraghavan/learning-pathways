import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Award,
  CheckCircle2,
  Download,
  FileText,
  Film,
  Link2,
  ListChecks,
  Lock,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";

import { getCertificates, getCurrentUser, getModule, getModuleProgress } from "@/data/repositories";
import type { Activity, ActivityType } from "@/data/types";
import { activityMeta, formatDate, formatMinutes, moduleMinutes } from "@/lib/format";
import { downloadText } from "@/lib/csv";
import { certificateFilename, certificateSvg } from "@/lib/certificate";
import { CategoryBadge, RequiredBadge, StatusDot } from "@/components/lessons/badges";
import { EmptyState } from "@/components/lessons/empty-state";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const TYPE_LABEL: Record<ActivityType, [string, string]> = {
  video: ["video", "videos"],
  deck: ["deck", "decks"],
  weblink: ["link", "links"],
  quiz: ["quiz", "quizzes"],
};

function componentsSummary(activities: Activity[]): string {
  const counts = activities.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});
  return (["video", "deck", "weblink", "quiz"] as ActivityType[])
    .filter((t) => counts[t])
    .map((t) => `${counts[t]} ${TYPE_LABEL[t][counts[t] === 1 ? 0 : 1]}`)
    .join(" · ");
}

export const Route = createFileRoute("/modules/$moduleId/")({
  head: () => ({
    meta: [
      { title: "Module — Lessons" },
      { name: "description", content: "Module overview, activities and progress." },
      { property: "og:title", content: "Module — Lessons" },
      { property: "og:description", content: "Module overview, activities and progress." },
    ],
  }),
  component: ModuleDetailPage,
});

const ICONS = { video: Film, deck: FileText, weblink: Link2, quiz: ListChecks } as const;

function ActivityIcon({ activity }: { activity: Activity }) {
  const Icon = ICONS[activity.type];
  return <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />;
}

function ModuleDetailPage() {
  const { moduleId } = Route.useParams();
  const [expanded, setExpanded] = useState(false);

  const { data: module, isPending } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: () => getModule(moduleId),
  });
  const { data: progress } = useQuery({
    queryKey: ["module-progress", moduleId],
    queryFn: () => getModuleProgress(moduleId),
  });
  const { data: certificates = [] } = useQuery({
    queryKey: ["certificates"],
    queryFn: getCertificates,
  });
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <EmptyState
          icon={SearchX}
          title="Module not available"
          description="This module isn't assigned to you, or it has been unpublished."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/home">Back to home</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const pct = progress?.progressPct ?? module.progressPct;
  const doneIds = progress?.completedActivityIds ?? [];
  const long = module.description.length > 180;
  const complete = module.status === "complete" || pct >= 100;
  const certificate = certificates.find((c) => c.moduleId === module.id);

  const downloadCertificate = () => {
    if (!certificate) return;
    downloadText(
      certificateFilename(certificate),
      certificateSvg(certificate, currentUser?.name ?? "Netscribes Learner"),
      "image/svg+xml",
    );
    toast.success("Certificate downloaded");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <img
        src={module.posterImage}
        alt=""
        width={1024}
        height={576}
        className="aspect-[16/6] w-full rounded-xl border border-border object-cover"
      />

      <nav className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span className="font-[510] text-foreground/70">{module.programTitle}</span>
        <span aria-hidden>›</span>
        <span className="font-[510] text-foreground/70">{module.skillTitle}</span>
        <span aria-hidden>›</span>
        <span>Module</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <CategoryBadge category={module.category} />
        <StatusDot status={module.status} withLabel />
        <span className="tnum text-xs text-muted-foreground">
          · Due {formatDate(module.dueDate)}
        </span>
      </div>

      <h1 className="text-title mt-2">{module.title}</h1>

      <div className="mt-4 flex items-center gap-3">
        <Progress
          value={pct}
          className="h-2 flex-1"
          indicatorClassName={
            module.category === "mandatory"
              ? "bg-cat-mandatory"
              : module.category === "onboarding"
                ? "bg-cat-onboarding"
                : module.category === "team"
                  ? "bg-cat-team"
                  : "bg-cat-bank"
          }
        />
        <span className="tnum text-sm text-muted-foreground">{pct}%</span>
      </div>

      <p className="tnum mt-2 text-xs text-muted-foreground">
        {componentsSummary(module.activities)} · {formatMinutes(moduleMinutes(module.activities))}{" "}
        total
      </p>

      {complete && certificate && (
        <div className="sky-panel mt-5 flex flex-wrap items-center gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-status-complete/10 text-status-complete">
            <Award className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-[510]">Certificate earned</p>
            <p className="tnum text-xs text-muted-foreground">{certificate.credentialId}</p>
          </div>
          <Button size="sm" onClick={downloadCertificate}>
            <Download className="size-4" strokeWidth={1.75} />
            Download certificate
          </Button>
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-label mb-1.5 text-muted-foreground">About</h2>
        <p className={long && !expanded ? "line-clamp-3 text-sm" : "text-sm"}>
          {module.description}
        </p>
        {long && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 text-sm text-primary hover:underline"
          >
            {expanded ? "See less" : "See more"}
          </button>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-card-title">Activities</h2>
            <span className="tnum text-xs text-muted-foreground">
              {module.activities.length} · {formatMinutes(moduleMinutes(module.activities))} total
            </span>
          </div>
          <Button asChild size="sm">
            <Link
              to="/modules/$moduleId/player"
              params={{ moduleId: module.id }}
              search={{ step: 0 }}
            >
              {pct > 0 ? "Resume module" : "Start module"}
            </Link>
          </Button>
        </div>

        <ul className="surface overflow-hidden">
          {module.activities.map((activity, i) => {
            const complete = doneIds.includes(activity.id);
            const locked =
              module.orderLocked &&
              module.activities.slice(0, i).some((a) => a.required && !doneIds.includes(a.id));
            return (
              <li
                key={activity.id}
                className={
                  "flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-0" +
                  (locked ? " opacity-60" : "")
                }
              >
                <span className="tnum w-4 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
                {complete ? (
                  <CheckCircle2
                    className="size-4 shrink-0 text-status-complete"
                    strokeWidth={1.75}
                  />
                ) : locked ? (
                  <Lock className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                ) : (
                  <ActivityIcon activity={activity} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-[510]">{activity.name}</p>
                    {activity.required && <RequiredBadge />}
                  </div>
                  <p className="tnum text-xs text-muted-foreground">{activityMeta(activity)}</p>
                </div>
                {locked ? (
                  <Button size="sm" variant="outline" className="shrink-0" disabled>
                    Locked
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <Link
                      to="/modules/$moduleId/player"
                      params={{ moduleId: module.id }}
                      search={{ step: i }}
                    >
                      {complete ? "Review" : "Continue"}
                    </Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
