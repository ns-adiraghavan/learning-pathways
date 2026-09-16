# Lessons colour and sidebar polish

## Scope
Apply a visual-only colour pass using the existing teal, indigo, violet, amber, and red tokens. Preserve all routes, interactions, state, repository contracts, and `src/data` files.

## Dashboard colour
- Extend the shared stat-tile treatment to support restrained solid and soft-tinted variants, animated with the existing count-up and reduced-motion behavior.
- Add compact four-tile KPI rows to:
  - **Home:** In progress, Due soon, Completed, Certificates.
  - **My Learning:** this is the current Progress destination, so refine its existing summary row rather than restoring a separate Progress tab.
  - **Admin Overview:** Active learners, Mandatory completion, Modules live, Overdue.
  - **Trainer Programs:** Programs, Skills, Modules, Learners.
- Use existing repository results already available or existing repository readers from the page layer only; do not modify the data layer.
- Use at most two solid tiles per row, with remaining tiles softly tinted so dashboards stay calm.

## Cards and category consistency
- Extend `surface`, `soft-tile`, `chip-blue`, and category helpers in the global design system for reusable tinted card surfaces, icon chips, and 3px accents.
- Tint secondary dashboard cards lightly while keeping card text, borders, and main surfaces neutral.
- Give Admin function cards distinct semantic accents: Users teal, Assignments indigo, Reports violet, Mandatory Quizzes red, and Customization amber. The four requested core functions retain the specified colours; the existing compliance card uses the alert colour.
- Pass each module category colour into progress rings and progress bars so mandatory, onboarding, team, and bank remain consistent across Home, My Learning, module detail, and related progress displays.
- Use `--chart-1` through `--chart-5` for analytics colour roles. Existing report pages remain tables; no new chart functionality or data is introduced.

## Sidebar
- Reduce the expanded desktop sidebar width while retaining the current mobile drawer and collapsed icon rail.
- Tighten menu spacing and keep the group label small, uppercase, and muted.
- Replace the soft active wash with a filled view-accent pill, contrasting icon/text, and a thin animated left indicator.
- Keep inactive icons neutral and preserve the current learner/trainer/admin view accent behavior, including brighter dark-mode teal.
- Retain the subtle divider under the header and ensure the full NS Lessons lockup still fits.

## Verification
- Check Home, My Learning, Admin Overview, Trainer Programs, and representative report/module screens at desktop and mobile widths in light and dark themes.
- Confirm KPI count-up, category progress colours, active navigation motion, no overlaps, and reduced-motion-safe styling.
- Confirm the preview builds cleanly and has no new runtime or console errors.
