import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronRight,
  ClipboardCheck,
  Clock,
  PartyPopper,
  Play,
  Trophy,
} from "lucide-react";

import {
  getAssignedModules,
  getCertificates,
  getCurrentUser,
  getLeaderboard,
  getPendingActions,
  getProgressSummary,
} from "@/data/repositories";
import type { LearningModule, PendingAction } from "@/data/types";
import { CATEGORY_LABEL, formatDate, formatMinutes, moduleMinutes } from "@/lib/format";
import { DoodlePanel } from "@/components/doodle-field";
import { EmptyState } from "@/components/lessons/empty-state";
import { PageFade, ShimmerBlock } from "@/components/motion/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — Lessons at Netscribes" },
      {
        name: "description",
        content:
          "Your assigned learning at a glance: what's due soon, what's in progress, and pending actions.",
      },
      { property: "og:title", content: "Home — Lessons at Netscribes" },
      {
        property: "og:description",
        content:
          "Your assigned learning at a glance: what's due soon, what's in progress, and pending actions.",
      },
    ],
  }),
  component: HomePage,
});

const CAT_TINT: Record<LearningModule["category"], string> = {
  mandatory: "var(--cat-mandatory)",
  onboarding: "var(--cat-onboarding)",
  team: "var(--cat-team)",
  bank: "var(--cat-bank)",
};

const CAT_CHIP: Record<LearningModule["category"], string> = {
  mandatory: "bg-cat-mandatory/12 text-cat-mandatory",
  onboarding: "bg-cat-onboarding/12 text-cat-onboarding",
  team: "bg-cat-team/12 text-cat-team",
  bank: "bg-cat-bank/12 text-cat-bank",
};

function priority(m: LearningModule) {
  let score = 0;
  if (m.status === "overdue") score += 100;
  if (m.category === "mandatory") score += 50;
  if (m.status === "in-progress") score += 25;
  return score;
}

const STATUS_META: Record<LearningModule["status"], { label: string; dot: string; text?: string }> =
  {
    overdue: { label: "Overdue", dot: "bg-status-overdue", text: "text-status-overdue" },
    "in-progress": { label: "In progress", dot: "bg-status-progress" },
    "not-started": { label: "Not started", dot: "bg-muted-foreground/50" },
    complete: { label: "Complete", dot: "bg-status-complete" },
  };

function HomePage() {
  const { data: user } = useQuery({ queryKey: ["current-user"], queryFn: getCurrentUser });
  const { data: modules, isPending } = useQuery({
    queryKey: ["modules"],
    queryFn: getAssignedModules,
  });
  const { data: actions = [] } = useQuery({
    queryKey: ["pending-actions"],
    queryFn: getPendingActions,
  });
  const { data: summary } = useQuery({
    queryKey: ["progress-summary"],
    queryFn: getProgressSummary,
  });
  const { data: certificates = [] } = useQuery({
    queryKey: ["certificates"],
    queryFn: getCertificates,
  });
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
  });

  const all = modules ?? [];
  const continueRow = [...all]
    .filter((m) => m.status !== "complete")
    .sort((a, b) => priority(b) - priority(a) || a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  const primary = continueRow.find((m) => m.status === "in-progress") ?? continueRow[0];

  const me = leaderboard.find((e) => e.isCurrentUser);
  const xp = me?.points ?? 0;
  const nextUp = me ? leaderboard.find((e) => e.rank === me.rank - 1) : undefined;
  const xpToNext = nextUp && me ? nextUp.points - me.points : 0;

  const total = summary?.totalModules ?? 0;
  const done = summary?.completedModules ?? 0;
  const overallPct = total ? Math.round((done / total) * 100) : 0;
  const mandatoryLeft = summary ? summary.mandatoryTotal - summary.mandatoryComplete : 0;

  return (
    <PageFade className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* HERO */}
      <section className="page-header blue-wash mb-6">
        <DoodlePanel />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="flex max-w-2xl flex-1 flex-col gap-3">
            <div>
              <h1 className="text-[30px] font-[590] tracking-tight sm:text-[34px]">
                {user ? `Hello, ${user.name.split(" ")[0]}` : "Hello"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Here's where your learning stands today — pick up right where you left off.
              </p>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Link
                to="/my-learning"
                search={{ status: "completed" }}
                className="block rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={`${done} completed — view completed modules`}
              >
                <RibbonTile
                  tint="var(--chart-1)"
                  tone="solid"
                  value={done}
                  label="Completed"
                  interactive
                />
              </Link>
              <Link
                to="/leaderboard"
                className="block rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={`${xp} XP points — view leaderboard`}
              >
                <RibbonTile tint="var(--chart-4)" value={xp} label="XP points" interactive />
              </Link>
              <Link
                to="/certificates"
                className="block rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={`${certificates.length} certificates — view certificates`}
              >
                <RibbonTile
                  tint="var(--chart-3)"
                  value={certificates.length}
                  label="Certificates"
                  interactive
                />
              </Link>
              <Link
                to="/my-learning"
                search={{ status: "in-progress" }}
                className="block rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={`${summary?.inProgressCount ?? 0} in progress — view in-progress modules`}
              >
                <RibbonTile
                  tint="var(--chart-2)"
                  value={summary?.inProgressCount ?? 0}
                  label="In progress"
                  interactive
                />
              </Link>
            </div>
          </div>

          {primary && <ResumeCard module={primary} />}
        </div>
      </section>

      {isPending ? (
        <div className="grid gap-4 lg:grid-cols-12">
          <ShimmerBlock className="h-64 rounded-2xl lg:col-span-8" />
          <ShimmerBlock className="h-64 rounded-2xl lg:col-span-4" />
        </div>
      ) : all.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="You're all caught up"
          description="Nothing is assigned to you right now. New modules appear here as soon as they're published to your team."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-[20px] font-[590]">Continue / Due soon</h2>
                <div className="flex items-center gap-3">
                  <Link
                    to="/browse"
                    className="inline-flex items-center gap-1 text-sm font-[510] text-primary hover:underline"
                  >
                    Browse catalog
                  </Link>
                  <Link
                    to="/my-learning"
                    search={{ status: "all" }}
                    className="inline-flex items-center gap-1 text-sm font-[510] text-primary hover:underline"
                  >
                    View all <ArrowRight className="size-4" strokeWidth={1.75} />
                  </Link>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {continueRow.map((m) => (
                  <ContinueCard key={m.id} module={m} />
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            <section className="surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-card-title">Overall progress</h3>
                <span className="tnum text-sm font-[590] text-primary">
                  {done} / {total}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Ring pct={overallPct} />
                <div>
                  <p className="text-sm font-[590]">
                    {overallPct >= 100 ? "All done!" : "Keep going!"}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {mandatoryLeft > 0
                      ? `${mandatoryLeft} mandatory module${mandatoryLeft === 1 ? "" : "s"} left to be fully compliant.`
                      : "You're fully compliant — nice work."}
                  </p>
                </div>
              </div>

              {/* Pending actions — folded in here; each links straight to where it's cleared */}
              <PendingActions actions={actions} />
            </section>

            {leaderboard.length > 0 && (
              <section className="surface p-5">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-5 text-cat-bank" strokeWidth={1.75} />
                    <h3 className="text-card-title">Team leaderboard</h3>
                  </div>
                  <Link
                    to="/leaderboard"
                    className="text-xs font-[510] text-primary hover:underline"
                  >
                    This week
                  </Link>
                </div>
                {me && (
                  <p className="mb-2 text-sm text-muted-foreground">
                    You're <span className="font-[590] text-foreground">#{me.rank}</span>
                    {xpToNext > 0
                      ? ` — ${xpToNext} XP from ${me.rank - 1}${ordinal(me.rank - 1)}.`
                      : "."}
                  </p>
                )}
                <ul className="grid gap-1">
                  {leaderboard.slice(0, 4).map((e) => (
                    <li
                      key={e.userId}
                      className={cn(
                        "flex items-center justify-between rounded-xl p-2",
                        e.isCurrentUser && "bg-primary/5 ring-1 ring-primary/20",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "w-5 shrink-0 text-center text-sm font-[590]",
                            e.rank === 1
                              ? "text-cat-bank"
                              : e.isCurrentUser
                                ? "text-primary"
                                : "text-muted-foreground",
                          )}
                        >
                          {e.rank}
                        </span>
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-[590]",
                            e.isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground",
                          )}
                        >
                          {initials(e.name)}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "flex items-center gap-1.5 truncate text-sm font-[510]",
                              e.isCurrentUser && "text-primary",
                            )}
                          >
                            {e.name}
                            {e.isCurrentUser && (
                              <span className="rounded bg-primary px-1.5 text-[10px] font-[590] text-primary-foreground">
                                You
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{e.team}</p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "tnum text-sm font-[590]",
                          e.isCurrentUser ? "text-primary" : "text-foreground",
                        )}
                      >
                        {e.points.toLocaleString("en-IN")}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </PageFade>
  );
}

/* ---------------- pieces ---------------- */

function RibbonTile({
  tint,
  value,
  label,
  tone = "soft",
  interactive = false,
}: {
  tint: string;
  value: number;
  label: string;
  tone?: "soft" | "solid";
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-4 py-3",
        tone === "solid" ? "solid-tile" : "soft-tile",
        interactive && "card-hover cursor-pointer transition-transform",
      )}
      style={{ ["--tile-tint" as string]: tint }}
    >
      <p className="tnum stat-tile-value text-2xl font-[590] leading-none">
        {value.toLocaleString("en-IN")}
      </p>
      <p className="stat-tile-label mt-1.5 text-xs">{label}</p>
    </div>
  );
}

function ResumeCard({ module }: { module: LearningModule }) {
  const next = module.activities[0]?.name;
  const total = moduleMinutes(module.activities);
  const left = Math.max(1, Math.round(total * (1 - module.progressPct / 100)));
  return (
    <div className="surface flex w-full shrink-0 flex-col gap-2.5 p-4 lg:w-[340px]">
      <div className="flex items-center justify-between">
        <span className="text-label uppercase tracking-wider text-primary">
          In progress · {module.programTitle}
        </span>
        <span className="chip-blue tnum rounded-full px-2 py-0.5 text-xs font-[510]">
          {module.progressPct}%
        </span>
      </div>
      <div>
        <h3 className="text-card-title">{module.title}</h3>
        <p className="truncate text-xs text-muted-foreground">
          {module.skillTitle}
          {next ? ` · next: ${next}` : ""}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${module.progressPct}%`,
            background: "linear-gradient(90deg, #38bdf8, var(--color-primary))",
          }}
        />
      </div>
      <div className="flex items-center justify-between pt-0.5">
        <span className="tnum inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 text-muted-foreground" strokeWidth={1.75} />~{left} min left
        </span>
        <Link
          to="/modules/$moduleId"
          params={{ moduleId: module.id }}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2 text-sm font-[510] text-primary-foreground shadow-sm transition-colors hover:bg-[var(--brand-blue)] active:translate-y-px"
        >
          Resume <Play className="size-4" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}

function ContinueCard({ module }: { module: LearningModule }) {
  const s = STATUS_META[module.status];
  const next = module.activities[0]?.name;
  const started = module.progressPct > 0;
  return (
    <article
      className="surface card-hover flex items-center gap-4 p-4"
      style={{ ["--cat-tint" as string]: CAT_TINT[module.category] }}
    >
      <img
        src={module.posterImage}
        alt=""
        loading="lazy"
        width={192}
        height={128}
        className="h-16 w-24 shrink-0 rounded-xl border border-border object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-[590]",
              CAT_CHIP[module.category],
            )}
          >
            {CATEGORY_LABEL[module.category]}
          </span>
          <span
            className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", s.text)}
          >
            <span className={cn("size-1.5 rounded-full", s.dot)} />
            {s.label}
          </span>
        </div>
        <h3 className="mt-1 truncate text-card-title">
          <Link
            to="/modules/$moduleId"
            params={{ moduleId: module.id }}
            className="hover:text-primary"
          >
            {module.title}
          </Link>
        </h3>
        {next && (
          <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <ArrowRight className="size-3.5 shrink-0 text-primary" strokeWidth={1.75} />
            Next: <span className="font-[510] text-foreground">{next}</span>
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-3">
          <div className="h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${Math.max(2, module.progressPct)}%` }}
            />
          </div>
          <span className="tnum text-xs text-muted-foreground">{module.progressPct}%</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="tnum text-xs text-muted-foreground">
          {formatMinutes(moduleMinutes(module.activities))}
        </span>
        <Link
          to="/modules/$moduleId"
          params={{ moduleId: module.id }}
          className="inline-flex items-center gap-1 rounded-full border border-[color:var(--brand-blue-soft)] bg-secondary px-4 py-1.5 text-sm font-[510] text-primary transition-colors hover:bg-accent"
        >
          {started ? "Continue" : "Start"} <ChevronRight className="size-4" strokeWidth={1.75} />
        </Link>
      </div>
    </article>
  );
}

function PendingActions({ actions }: { actions: PendingAction[] }) {
  return (
    <div className="mt-5 border-t border-border pt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ClipboardCheck className="size-4 text-primary" strokeWidth={1.75} />
          <h4 className="text-sm font-[590]">
            Pending actions
            {actions.length > 0 && (
              <span className="tnum ml-1.5 text-muted-foreground">{actions.length}</span>
            )}
          </h4>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-[510]",
            actions.length === 0
              ? "bg-status-complete/12 text-status-complete"
              : "bg-cat-bank/15 text-cat-bank",
          )}
        >
          {actions.length === 0 ? "All clear" : "Action needed"}
        </span>
      </div>
      {actions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You're up to date on surveys and declarations.
        </p>
      ) : (
        <ul className="grid gap-1.5">
          {actions.map((a) => (
            <li key={a.id}>
              <Link
                to="/certificates"
                className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:bg-accent/40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-[510]">{a.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {a.kind === "survey" ? "Survey" : "eSignature"} · due {formatDate(a.dueDate)}
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.75}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-24 shrink-0 place-items-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--color-border)" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <div className="absolute text-center">
        <p className="tnum text-lg font-[590] leading-none">{pct}%</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">complete</p>
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0]!;
}
