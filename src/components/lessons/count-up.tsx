import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
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
  to,
  search,
}: {
  label: string;
  value: number;
  suffix?: string;
  tint?: string;
  tone?: "neutral" | "soft" | "solid";
  /** Optional destination — makes the tile a link to a pre-filtered list. */
  to?: string;
  search?: Record<string, string>;
}) {
  const shown = useCountUp(value);
  const className = cn(
    "block h-full px-4 py-3 text-left",
    tone === "neutral" && "surface",
    tone === "soft" && "soft-tile",
    tone === "solid" && "solid-tile",
    to && "card-hover cursor-pointer",
  );
  const style = tint ? { ["--tile-tint" as string]: tint } : undefined;
  const body = (
    <>
      <p className="text-label stat-tile-label">{label}</p>
      <p className="tnum stat-tile-value mt-1 text-2xl font-[590]">
        {shown}
        <span className="stat-tile-suffix text-base">{suffix}</span>
      </p>
    </>
  );

  if (to) {
    return (
      <Link to={to as "/my-learning"} search={search as never} className={className} style={style}>
        {body}
      </Link>
    );
  }

  return (
    <div className={className} style={style}>
      {body}
    </div>
  );
}
