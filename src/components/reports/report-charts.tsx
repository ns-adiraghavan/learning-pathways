/**
 * Inline, dependency-free report charts. Kept deliberately small — magnitude
 * bars are single-hue (the title names the series, so no categorical palette),
 * composition uses the reserved status colours with a legend, and trend is a
 * single line. Colours come from the design-system CSS tokens (chart-1..5,
 * status-*), so light/dark both work without a JS theme flip.
 */

import type { ReportChart, ReportKpi } from "@/data/types";
import { cn } from "@/lib/utils";

function fmt(n: number): string {
  return n.toLocaleString("en-IN");
}

export function KpiRow({ kpis }: { kpis: ReportKpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="soft-tile animate-soft-in px-4 py-3"
          style={{ ["--tile-tint" as string]: k.tint ?? "var(--chart-1)" }}
        >
          <p className="stat-tile-label text-xs">{k.label}</p>
          <p className="stat-tile-value tnum mt-1 text-2xl font-[560]">
            {fmt(k.value)}
            {k.suffix ? <span className="stat-tile-suffix text-base"> {k.suffix}</span> : null}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ReportChartCard({ chart }: { chart: ReportChart }) {
  return (
    <section className="surface p-4 sm:p-5">
      <h3 className="text-card-title mb-4">{chart.title}</h3>
      {chart.kind === "bar" ? (
        <BarChart chart={chart} />
      ) : chart.kind === "donut" ? (
        <DonutChart chart={chart} />
      ) : (
        <LineChart chart={chart} />
      )}
    </section>
  );
}

function BarChart({ chart }: { chart: ReportChart }) {
  const max = Math.max(...chart.series.map((s) => s.value), 1);
  return (
    <div className="grid gap-2.5">
      {chart.series.map((s) => (
        <div
          key={s.label}
          className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3"
        >
          <span className="truncate text-sm text-muted-foreground" title={s.label}>
            {s.label}
          </span>
          <div className="h-2.5 rounded-full bg-muted">
            <div
              className="h-2.5 rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${Math.max(2, (s.value / max) * 100)}%`,
                backgroundColor: s.tint ?? "var(--chart-1)",
              }}
            />
          </div>
          <span className="tnum w-14 text-right text-sm font-[510]">
            {fmt(s.value)}
            {chart.suffix ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ chart }: { chart: ReportChart }) {
  const total = chart.series.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = 54;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg
        viewBox="0 0 140 140"
        className="size-36 shrink-0 -rotate-90"
        role="img"
        aria-label={chart.title}
      >
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--muted)" strokeWidth="18" />
        {chart.series.map((s) => {
          const len = (s.value / total) * c;
          const gap = 2;
          const seg = (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={s.tint ?? "var(--chart-1)"}
              strokeWidth="18"
              strokeLinecap="butt"
              strokeDasharray={`${Math.max(0, len - gap)} ${c - Math.max(0, len - gap)}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return seg;
        })}
      </svg>
      <ul className="grid gap-2">
        {chart.series.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: s.tint ?? "var(--chart-1)" }}
            />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="tnum ml-1 font-[510]">
              {fmt(s.value)}
              {chart.suffix ?? ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LineChart({ chart }: { chart: ReportChart }) {
  const w = 520;
  const h = 160;
  const padX = 12;
  const padY = 16;
  const values = chart.series.map((s) => s.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = chart.series.length > 1 ? (w - padX * 2) / (chart.series.length - 1) : 0;

  const point = (v: number, i: number) => {
    const x = padX + i * step;
    const y = padY + (1 - (v - min) / span) * (h - padY * 2);
    return [x, y] as const;
  };
  const pts = chart.series.map((s, i) => point(s.value, i));
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${padX},${h - padY} ${line} ${padX + (chart.series.length - 1) * step},${h - padY}`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" role="img" aria-label={chart.title}>
        <defs>
          <linearGradient id="report-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#report-line-fill)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3.5"
            fill="var(--card)"
            stroke="var(--chart-1)"
            strokeWidth="2"
          >
            <title>
              {chart.series[i]!.label}: {fmt(chart.series[i]!.value)}
            </title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-2">
        {chart.series.map((s) => (
          <span key={s.label} className={cn("text-xs text-muted-foreground")}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
