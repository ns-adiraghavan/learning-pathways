import type { Activity } from "@/data/types";

/**
 * Whether a learner may open activity `index` yet.
 *
 * Two rules combine:
 *  1. Quiz gate (always on): a quiz can't be opened until every earlier
 *     non-quiz activity (video, deck, link) is complete — you assess after
 *     you've been through the content.
 *  2. Order gate (only when the module is `orderLocked`): a step is locked
 *     until every earlier *required* activity is complete.
 */
export function isStepLocked(
  activities: Activity[],
  index: number,
  doneIds: string[],
  orderLocked: boolean,
): boolean {
  const target = activities[index];
  if (!target) return false;

  if (target.type === "quiz") {
    const earlierContent = activities.slice(0, index).filter((a) => a.type !== "quiz");
    if (earlierContent.some((a) => !doneIds.includes(a.id))) return true;
  }

  if (orderLocked) {
    if (activities.slice(0, index).some((a) => a.required && !doneIds.includes(a.id))) return true;
  }

  return false;
}
