import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  showLabel?: boolean;
  color?: string;
}

export function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  className,
  showLabel = true,
  color = "var(--color-status-progress)",
}: ProgressRingProps) {
  const [shown, setShown] = useState(0);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke="var(--color-border)"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (Math.min(100, Math.max(0, shown)) / 100) * circumference}
          style={{ transition: "stroke-dashoffset 240ms ease-out" }}
        />
      </svg>
      {showLabel && (
        <span
          className="tnum absolute font-[510] text-foreground"
          style={{ fontSize: Math.max(10, size * 0.26) }}
        >
          {Math.round(value)}
        </span>
      )}
    </div>
  );
}
