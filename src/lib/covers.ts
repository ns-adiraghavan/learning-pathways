/**
 * Stock cover art for modules and quizzes.
 *
 * A curated set of on-brand SVG covers, encoded as data URIs so they need no
 * asset pipeline, no network, and no external stock library — a trainer picks
 * one while titling a module/quiz (the title is overlaid by the card, so the
 * covers are deliberately graphic, not text-heavy).
 *
 * Add a cover by adding a row to COVER_SPECS; ids are stable and safe to store
 * on a ModuleDraft.posterImage. Swap for real uploaded images later by pointing
 * posterImage at a URL instead — nothing else changes.
 */

type Motif =
  | "chart"
  | "layers"
  | "cap"
  | "bulb"
  | "rocket"
  | "target"
  | "gears"
  | "grid"
  | "compass"
  | "book"
  | "checklist"
  | "code";

interface CoverSpec {
  id: string;
  title: string;
  from: string;
  to: string;
  motif: Motif;
}

const COVER_SPECS: CoverSpec[] = [
  { id: "sky-analytics", title: "Sky Analytics", from: "#0ea5e9", to: "#0284c7", motif: "chart" },
  { id: "deep-ocean", title: "Deep Ocean", from: "#0284c7", to: "#1e3a8a", motif: "layers" },
  { id: "violet-mastery", title: "Violet Mastery", from: "#7c3aed", to: "#4f46e5", motif: "cap" },
  { id: "amber-focus", title: "Amber Focus", from: "#f59e0b", to: "#ea580c", motif: "bulb" },
  {
    id: "emerald-growth",
    title: "Emerald Growth",
    from: "#10b981",
    to: "#0d9488",
    motif: "rocket",
  },
  { id: "coral-insight", title: "Coral Insight", from: "#f43f5e", to: "#be123c", motif: "target" },
  { id: "slate-systems", title: "Slate Systems", from: "#475569", to: "#1e293b", motif: "gears" },
  { id: "cyan-data", title: "Cyan Data", from: "#06b6d4", to: "#0369a1", motif: "grid" },
  {
    id: "indigo-strategy",
    title: "Indigo Strategy",
    from: "#6366f1",
    to: "#4338ca",
    motif: "compass",
  },
  { id: "teal-knowledge", title: "Teal Knowledge", from: "#14b8a6", to: "#0f766e", motif: "book" },
  {
    id: "sunset-skills",
    title: "Sunset Skills",
    from: "#fb923c",
    to: "#e11d48",
    motif: "checklist",
  },
  { id: "midnight-code", title: "Midnight Code", from: "#334155", to: "#0f172a", motif: "code" },
];

/** Motif drawn in a 64×64 box, stroked in white; scaled/placed by the cover. */
const MOTIF: Record<Motif, string> = {
  chart: `<path d="M8 54h48M14 54V34M28 54V20M42 54V28M56 54V14"/>`,
  layers: `<path d="M32 10 58 24 32 38 6 24Z"/><path d="M6 34 32 48 58 34"/>`,
  cap: `<path d="M32 12 60 26 32 40 4 26Z"/><path d="M16 33v14q16 10 32 0V33"/><path d="M60 26v16"/>`,
  bulb: `<path d="M32 8a16 16 0 0 1 10 28c-2 2-3 4-3 7H25c0-3-1-5-3-7A16 16 0 0 1 32 8Z"/><path d="M26 51h12M28 57h8"/>`,
  rocket: `<path d="M32 6c10 6 14 16 14 28l-6 6H24l-6-6C18 22 22 12 32 6Z"/><circle cx="32" cy="26" r="5"/><path d="M24 46l-8 10M40 46l8 10"/>`,
  target: `<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="13"/><circle cx="32" cy="32" r="4"/>`,
  gears: `<circle cx="26" cy="30" r="11"/><path d="M26 13v-5M26 52v-5M9 30H4M48 30h-5M14 18l-4-4M42 46l-4-4M38 18l4-4M14 46l-4 4"/><circle cx="46" cy="46" r="7"/>`,
  grid: `<rect x="10" y="10" width="44" height="44" rx="4"/><path d="M10 25h44M10 39h44M25 10v44M39 10v44"/>`,
  compass: `<circle cx="32" cy="32" r="23"/><path d="M42 22 35 35 22 42 29 29Z"/>`,
  book: `<path d="M32 16C26 11 14 11 10 14v36c4-3 16-3 22 2 6-5 18-5 22-2V14c-4-3-16-3-22 2Z"/><path d="M32 18v34"/>`,
  checklist: `<rect x="12" y="8" width="40" height="48" rx="5"/><path d="M20 22l4 4 7-8M20 38l4 4 7-8"/><path d="M36 22h10M36 38h10"/>`,
  code: `<path d="M22 20 8 32l14 12M42 20l14 12-14 12M36 14 28 50"/>`,
};

function svgFor(spec: CoverSpec): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="none">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${spec.from}"/><stop offset="1" stop-color="${spec.to}"/>
  </linearGradient></defs>
  <rect width="800" height="450" fill="url(#g)"/>
  <g stroke="#ffffff" stroke-opacity="0.16" stroke-width="2" fill="none">
    <circle cx="120" cy="90" r="52"/><circle cx="690" cy="380" r="70"/>
    <circle cx="640" cy="70" r="8" fill="#ffffff" fill-opacity="0.25" stroke="none"/>
    <circle cx="180" cy="360" r="6" fill="#ffffff" fill-opacity="0.25" stroke="none"/>
  </g>
  <g transform="translate(452 105) scale(4.2)" stroke="#ffffff" stroke-opacity="0.92" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none">
    ${MOTIF[spec.motif]}
  </g>
</svg>`;
}

export function coverDataUri(id: string): string {
  const spec = COVER_SPECS.find((c) => c.id === id) ?? COVER_SPECS[0]!;
  return `data:image/svg+xml,${encodeURIComponent(svgFor(spec))}`;
}

export interface Cover {
  id: string;
  title: string;
  dataUri: string;
}

export const COVERS: Cover[] = COVER_SPECS.map((spec) => ({
  id: spec.id,
  title: spec.title,
  dataUri: `data:image/svg+xml,${encodeURIComponent(svgFor(spec))}`,
}));
