# Lessons LMS — composite changed set (all passes)

Unzip at the repo root (paths preserved) and run your sync script — it pushes only what differs.
`tsc --noEmit` + `eslint` clean; no dependencies added. 27 files.

## This pass — your latest feedback
| Item | What changed | Files |
|---|---|---|
| **Collapsed sidebar looked broken** | The wide logo cropped to a strip read as a sliver. Collapsed now shows the square **favicon mark**, centered. | `components/brand-lockup.tsx` |
| **Opening a module jumped to the video** | Home's Resume / Continue / Start now open the **module overview** (summary of all components) instead of the player. From there you enter the player. | `routes/home.tsx` |
| **Module overview = summary of components** | Added a contents line ("2 decks · 1 quiz · ~34 min total") under the title, keeping the Program › Skill breadcrumb and the full activity list. | `routes/modules/$moduleId/index.tsx` |
| **My Learning too similar to Home** | Rebuilt as a **module-wise** working view, distinct from Home's dashboard: a completion-by-category strip, status tabs with counts + program filter + search, and a detailed row per module (cover, category, status, **contents**, progress, est. time, due, Open). | `routes/my-learning.tsx` |
| **Leaderboard needs team / time / a visual** | Added a **period** selector (week / month / quarter), a **team** filter, an **Individuals ↔ By team** toggle, and a **bar-chart** visual (top learners, or points by team), alongside the ranked list (medals for top 3, you highlighted) and a period/view-aware CSV export. | `routes/leaderboard.tsx` |
| **Download certificate in the module + bulk** | The module overview shows a **Download certificate** card when the module is complete and a credential exists (renders the Clear Sky SVG). Bulk **Download all** already lives on the Certificates page. | `routes/modules/$moduleId/index.tsx` |

Note on "same thing with skills": there's no learner-facing Skill route yet (skills live in the trainer
authoring side). The module overview now carries the Program › Skill breadcrumb; a dedicated learner
**Skill** page (its modules, summarised) is a clean next follow-on if you want it.

## Earlier passes (included)
Learner **Home** rebuilt to the Clear Sky reference; the five review fixes (sidebar, default covers,
Program→Skill breadcrumb, estimated reading time, quiz start screen); Certificates redesign; Admin user
directory; Reports suite + custom builder; config surfaces; cover gallery + picker; supporting
types/mocks/repositories.

## Verification caveat
The live build needs the private `@lovable.dev/vite-tanstack-config` package (403 in this sandbox) and the
Tailwind CDN is also blocked here, so I validate with `tsc` + `eslint` and, for net-new layouts, a
self-contained static render. My Learning and Leaderboard reuse the same utilities/patterns already
rendered on Home, so give them a quick look once deployed.
