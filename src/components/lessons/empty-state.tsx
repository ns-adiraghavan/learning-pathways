import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: import("lucide-react").LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const variant = Array.from(title).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3;
  return (
    <div className="surface blue-wash animate-soft-in relative flex min-h-48 flex-col items-center justify-center overflow-hidden px-6 py-10 text-center">
      <svg aria-hidden viewBox="0 0 180 90" className="pointer-events-none absolute inset-x-0 top-2 mx-auto h-20 w-40 text-primary/20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        {variant === 0 ? <><path d="M12 64c18-39 35 24 58-12s43 26 96-22"/><circle cx="42" cy="25" r="9"/><path d="m139 18 10 10-10 10"/></> : variant === 1 ? <><path d="M18 55c24-28 42-28 66 0s46 27 78-6"/><path d="M36 21h22M47 10v22"/><circle cx="136" cy="28" r="12"/></> : <><path d="m16 66 40-40 35 34 31-31 42 38"/><path d="M115 13v20M105 23h20"/><circle cx="62" cy="19" r="5"/></>}
      </svg>
      <div className="relative mb-3 mt-9 flex size-10 items-center justify-center rounded-full border border-primary/20 bg-secondary">
        <Icon className="size-4 text-primary" strokeWidth={1.75} />
      </div>
      <p className="relative text-card-title text-foreground">{title}</p>
      <p className="relative mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
