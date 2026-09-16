import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Counts a number up over ~220ms, ease-out; static when reduced motion is on. */
export function useCountUp(target: number, duration = 220) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export function StatTile({
  label,
  value,
  suffix = "",
  tint,
  tone = "neutral",
}: {
  label: string;
  value: number;
  suffix?: string;
  tint?: string;
  tone?: "neutral" | "soft" | "solid";
}) {
  const shown = useCountUp(value);
  return (
    <div
      className={cn(
        "h-full px-4 py-3",
        tone === "neutral" && "surface",
        tone === "soft" && "soft-tile",
        tone === "solid" && "solid-tile",
      )}
      style={tint ? { ["--tile-tint" as string]: tint } : undefined}
    >
      <p className="text-label stat-tile-label">{label}</p>
      <p className="tnum stat-tile-value mt-1 text-2xl font-[590]">
        {shown}
        <span className="stat-tile-suffix text-base">{suffix}</span>
      </p>
    </div>
  );
}
