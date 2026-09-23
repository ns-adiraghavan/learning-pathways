import type { Activity, ModuleCategory, ModuleStatus } from "@/data/types";

export const CATEGORY_LABEL: Record<ModuleCategory, string> = {
  mandatory: "Mandatory",
  onboarding: "Onboarding",
  team: "Team",
  bank: "Course Bank",
};

export const STATUS_LABEL: Record<ModuleStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  complete: "Complete",
  overdue: "Overdue",
};

export const STATUS_DOT: Record<ModuleStatus, string> = {
  "not-started": "bg-muted-foreground/50",
  "in-progress": "bg-status-progress",
  complete: "bg-status-complete",
  overdue: "bg-status-overdue",
};

/**
 * A "new joiner" is someone who joined within the last 120 days. Used to show a
 * badge ONLY when it actually applies, rather than labelling everyone.
 */
export function isNewJoiner(joiningDate: string, asOf: Date = new Date()): boolean {
  const joined = new Date(joiningDate);
  if (Number.isNaN(joined.getTime())) return false;
  const days = (asOf.getTime() - joined.getTime()) / 86_400_000;
  return days >= 0 && days <= 120;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Estimated minutes to get through an activity — the "size" of its content.
 * Videos use their runtime; decks estimate ~1.5 min of reading per page; a
 * web link is a quick read; a quiz uses its time limit.
 */
export function activityMinutes(activity: Activity): number {
  switch (activity.type) {
    case "video":
      return Math.max(1, activity.durationMins);
    case "deck":
      return Math.max(1, Math.round(activity.pages * 1.5));
    case "weblink":
      return 3;
    case "quiz":
      return Math.max(1, activity.timeLimitMins);
  }
}

/** Total estimated minutes across a module's activities. */
export function moduleMinutes(activities: Activity[]): number {
  return activities.reduce((sum, a) => sum + activityMinutes(a), 0);
}

/** Human "~X min" / "~1h 05m" label. */
export function formatMinutes(mins: number): string {
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `~${h}h ${String(m).padStart(2, "0")}m` : `~${h}h`;
}

export function activityMeta(activity: Activity): string {
  switch (activity.type) {
    case "video":
      return `Video · ${activity.durationMins} min`;
    case "deck":
      return `Deck · ${activity.pages} pages · ${formatMinutes(activityMinutes(activity))} read`;
    case "weblink":
      return `Link · ${formatMinutes(activityMinutes(activity))} read`;
    case "quiz":
      return `Quiz · ${activity.questions.length} questions · ${activity.timeLimitMins} min`;
  }
}
