# Lessons LMS — composite changed set (all passes)

Unzip at the repo root (paths preserved) and run your sync script — it pushes only what differs.
`tsc --noEmit` + `eslint` clean; no dependencies added (`package.json` / `bun.lock` untouched).
24 files.

## Learner Home — rebuilt to the Clear Sky reference (this pass)
`routes/home.tsx` is redesigned to match your screenshot-5 reference, on **real Netscribes data**:
- Hero with a streak chip, a solid/soft **stat ribbon** (Completed / XP / Certificates / In-progress) and a **Resume** card for the active module (program · skill · next activity · % · minutes left).
- A two-column workspace. Left: rich **Continue / Due soon** cards (cover thumbnail, category chip, status dot, "Next: …", progress bar, est. time, Continue/Start); a **Curriculum roadmap** skill-tree built from the Program→Skill taxonomy with done / active / locked nodes; a pending-actions callout.
- Right rail: an **Overall progress** ring, **Upcoming quizzes** (from real quiz activities, sorted by due date), the **Team leaderboard** (you highlighted, with "N XP from Nth"), and a quote.
- XP, ranks, counts, quizzes and roadmap are all derived from the mock repositories — not invented.

Preview: `lessons-home-redesign.png`. This is the flagship; the same pattern rolls outward to the other screens next.

## Earlier review fixes (included)
| Issue | Fix |
|---|---|
| Sidebar weird when collapsed | Icon-only, centered, accent rail + label hidden when collapsed. |
| Default images wrong | Module covers default to the crisp on-brand SVG covers, matched to category hue. |
| Inner views ignore Skills/Modules | `LearningModule` carries `programTitle`/`skillTitle`; module page shows Program › Skill › Module. |
| Estimated reading time | `activityMinutes`/`moduleMinutes` (deck ≈ 1.5 min/page); shown per activity + module total. |
| Quiz starts immediately | Quizzes open on a start screen; timer begins only on **Start quiz**. |

## Everything before that (included)
Certificates redesign; Admin user directory (slicers, table, bulk, import, edit-user, login-as);
Reports suite (5 reports × 5 tabs, slicers, KPIs, inline charts, export) + custom report builder;
config surfaces (notifications matrix, enrollment rules, points rules); stock cover gallery + picker;
plus the supporting types/mocks/repositories.

## Verification caveat
The full app build needs the private `@lovable.dev/vite-tanstack-config` package, which 403s from this
sandbox, so I can't run the live app here. The new Home was validated by (1) `tsc` + `eslint`, and (2) a
self-contained static render of the exact layout (the attached PNG). Give it a quick look once deployed.
