import { useEffect, useState } from "react";

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
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  const shown = useCountUp(value);
  return (
    <div className="surface px-4 py-3">
      <p className="text-label text-muted-foreground">{label}</p>
      <p className="tnum mt-1 text-2xl font-[510]">
        {shown}
        <span className="text-base text-muted-foreground">{suffix}</span>
      </p>
    </div>
  );
}
