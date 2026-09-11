import { ExternalLink } from "lucide-react";

import type { WeblinkActivity as WeblinkActivityType } from "@/data/types";
import { Button } from "@/components/ui/button";

export function WeblinkActivity({
  activity,
  onComplete,
  done,
}: {
  activity: WeblinkActivityType;
  onComplete: () => void;
  done: boolean;
}) {
  return (
    <div className="surface p-6">
      <p className="text-card-title">{activity.name}</p>
      <a
        href={activity.url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        {activity.url}
        <ExternalLink className="size-3.5" strokeWidth={1.75} />
      </a>
      <div className="mt-6">
        <Button onClick={onComplete}>{done ? "Continue" : "Mark as visited"}</Button>
      </div>
    </div>
  );
}
