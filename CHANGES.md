# Lessons LMS — composite changed set (Pass 1 + Pass 2 + covers)

Everything changed across all passes, in one drop. Unzip at the repo root (paths preserved) and push.
**No dependencies added** — ZIP writer, charts, and cover art are all hand-rolled, so
`package.json` / `bun.lock` are untouched. `tsc --noEmit` and `eslint` are clean (only tsc error is the
private `@lovable.dev/vite-tanstack-config`, which resolves in your environment).

18 files — 9 new, 9 modified.

## New files
| Path | What it does |
|---|---|
| `src/lib/zip.ts` | Dependency-free STORE-method ZIP writer + `downloadBlob`. |
| `src/lib/certificate.ts` | Certificate → standalone SVG. |
| `src/lib/covers.ts` | **12 stock cover images** as on-brand SVG data URIs (no asset pipeline, no network). |
| `src/components/trainer/cover-picker.tsx` | **Cover gallery dialog** — pick a stock cover while titling a module/quiz. |
| `src/components/admin/edit-user-drawer.tsx` | Slide-in user editor → `updateUser()`, with "Login as". |
| `src/components/admin/import-users-dialog.tsx` | CSV import: sample download, parse + validation, `addUser()` per row. |
| `src/components/admin/config-sections.tsx` | Notifications matrix, enrollment rules, points rules. |
| `src/components/reports/report-charts.tsx` | Inline KPI tiles, bars, donut, trend line. |
| `src/components/reports/custom-report-builder.tsx` | Custom report builder dialog. |

## Modified files
| Path | Change |
|---|---|
| `src/components/trainer/content-flow-tab.tsx` | **Covers** — the dead "Change poster" button is now a live cover picker writing to `posterImage`. |
| `src/routes/certificates.tsx` | Redesign: Download (SVG) + Share, Download all (zip), X-of-Y progress. |
| `src/routes/admin/users.tsx` | Multi-field slicers, full table, bulk bar, import/export, row actions. |
| `src/routes/admin/reports.index.tsx` | 5 report cards + custom report builder. |
| `src/routes/admin/reports.$reportId.tsx` | 5-tab set, slicers, KPIs + charts, per-tab export. |
| `src/routes/admin/customization.tsx` | Three config sections replace the old notification toggles. |
| `src/data/types.ts` | User attributes + `UserFilters`; report tab/kpi/chart types; config types. |
| `src/data/repositories.ts` | Multi-field `getUsers`; tab-aware `getReport` + `generateCustomReport`; config get/save. |
| `src/data/admin-mocks.ts` | User attribute fields + facet vocab; tabbed report generator; config mocks. |

## Covers (this batch)
`src/lib/covers.ts` holds 12 curated covers (Sky Analytics, Deep Ocean, Violet Mastery, Amber Focus,
Emerald Growth, Coral Insight, Slate Systems, Cyan Data, Indigo Strategy, Teal Knowledge, Sunset Skills,
Midnight Code) — each an SVG data URI, so they need no image files or network. The trainer picks one in the
module editor's Content Flow tab (next to Title/Description). `posterImage` still just stores a string, so
swapping to real uploaded images later is a drop-in: point it at a URL. See `lessons-cover-gallery.png`.

## Hierarchy & order-gating — verified, unchanged
The Program → Skill → Module → activities hierarchy holds through the routes
(`trainer/programs` → `programs.$programId` → `skills.$skillId` → `modules.$moduleId`; learner:
`modules/$moduleId` → `player`). **Order-gating already works** in the course player:
when a module's `orderLocked` is on, `isLocked(step)` blocks any step whose prior *required* activities
aren't complete, deep-links clamp back to the earliest open step, and locked stepper buttons are disabled
with a lock icon. No change was needed here — enforcing it is correct as built.

## Notes
- Report charts are inline SVG/HTML (not recharts) — no dependency/CDN in the build.
- Backend-owned engines (report queries, delivery, enrollment, points, real impersonation) are UI
  placeholders per the "our slice vs backend" divide; every read/write flows through `repositories.ts`
  with `// CONNECT` markers.
