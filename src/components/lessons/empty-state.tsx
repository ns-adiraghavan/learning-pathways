import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="surface animate-soft-in flex flex-col items-center justify-center px-6 py-11 text-center">
      <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="text-card-title text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
