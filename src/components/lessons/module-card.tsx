import { Link } from "@tanstack/react-router";
import type { LearningModule } from "@/data/types";
import { formatDate } from "@/lib/format";
import { CategoryBadge, StatusDot } from "./badges";
import { ProgressRing } from "./progress-ring";

export function ModuleCard({ module }: { module: LearningModule }) {
  return (
    <Link
      to="/modules/$moduleId"
      params={{ moduleId: module.id }}
      className="surface card-hover group block overflow-hidden"
    >
      <div className="relative aspect-[16/7] w-full overflow-hidden border-b border-border bg-muted">
        <img
          src={module.posterImage}
          alt=""
          loading="lazy"
          width={1024}
          height={576}
          className="size-full object-cover"
        />
      </div>
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CategoryBadge category={module.category} />
            <StatusDot status={module.status} withLabel />
          </div>
          <h3 className="text-card-title truncate text-foreground">{module.title}</h3>
          <p className="tnum mt-1 text-xs text-muted-foreground">
            Due {formatDate(module.dueDate)}
          </p>
        </div>
        <ProgressRing value={module.progressPct} />
      </div>
    </Link>
  );
}
