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

export function activityMeta(activity: Activity): string {
  switch (activity.type) {
    case "video":
      return `Video · ${activity.durationMins} min`;
    case "deck":
      return `Deck · ${activity.pages} pages`;
    case "weblink":
      return "Link · external";
    case "quiz":
      return `Quiz · ${activity.questions.length} questions · ${activity.timeLimitMins} min`;
  }
}
