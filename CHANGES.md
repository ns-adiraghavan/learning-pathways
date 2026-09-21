# Lessons LMS — composite changed set (all passes)

Unzip at the repo root (paths preserved) and run your sync script — it'll push only what differs.
`tsc --noEmit` + `eslint` clean; no dependencies added (`package.json` / `bun.lock` untouched).

23 files. This drop adds the fixes from your latest review on top of the earlier passes.

## This review — what changed
| Issue | Fix | Files |
|---|---|---|
| **Sidebar weird when collapsed** | In icon-collapsed mode the accent rail and label are hidden and the icon is centered, so the rail is a clean icon strip. | `components/app-sidebar.tsx` |
| **Default images wrong** (blurry photos) | Module covers now default to the crisp on-brand SVG covers, matched to each category's hue (mandatory=indigo, onboarding=violet, team=teal, bank=amber). The old poster JPGs are no longer referenced. | `data/mocks.ts` |
| **Inner views ignore Skills/Modules** | `LearningModule` now carries `programTitle` + `skillTitle`; the learner module page shows a **Program › Skill › Module** breadcrumb. | `data/types.ts`, `data/mocks.ts`, `routes/modules/$moduleId/index.tsx` |
| **Estimated reading time** | New `activityMinutes` / `moduleMinutes` / `formatMinutes` — videos use runtime, **decks estimate ~1.5 min/page**, links ~3 min, quizzes their limit. Shown per activity and as a module total ("N · ~34 min total"). | `lib/format.ts`, `routes/modules/$moduleId/index.tsx` |
| **Quiz starts immediately** | Quizzes now open on a **start screen** (name, question count, time limit, compliance tag) and the timer only begins when the learner clicks **Start quiz**. | `components/lessons/activities/quiz-activity.tsx` |

## Earlier passes (still included)
Certificates redesign; Admin user directory (slicers, table, bulk, import, edit-user drawer, login-as);
Reports suite (5 reports × 5 tabs, slicers, KPIs, inline charts, export) + custom report builder;
config surfaces (notifications matrix, enrollment rules, points rules); stock cover gallery + picker;
plus the data-layer types/mocks/repositories behind them.

## On the design system (honest note)
The app already runs on Clear Sky's palette (sky `#0ea5e9` primary, Inter, pill radii, ambient sky
shadows) — the tokens in `DESIGN.md` are in `styles.css` and every screen uses them. What the reference
`code.html` mock adds is a **Material-3 flavour**: Material Symbols icons (we use lucide), the M3 semantic
token *names* (`surface-container-*`, `primary-container`, …), and a denser hero/dashboard layout. Matching
that mock 1:1 is a **larger, focused re-skin** (icon library swap + token remap + layout rebuild), not a
few tweaks — and it's the kind of change that needs to be seen rendered, not shipped blind. Say the word and
I'll take the **learner Home** (your screenshot 5) as the flagship and rebuild it to that fidelity first, then
roll the pattern outward.
