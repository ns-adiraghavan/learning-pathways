# Lessons — simplicity, consistency & volume pass

Unzip at the repo root and sync. `tsc` and `vite build` are clean; no new dependencies. The route tree regenerates on build (the standalone trainer quiz route was removed).

## Learner
- **Home simplified** — removed *Upcoming quizzes*, *Curriculum roadmap*, the decorative streak chip and quote block, and the ☀️ greeting. Left: continue/due-soon, overall progress, pending actions, compact leaderboard.
- **Tiles-based catalog** (`browse.tsx`) — Program tiles that expand to Skill tiles that expand to Module cards. Collapsed by default, search across the whole tree (auto-expands matches), per-level progress. Built to stay legible at high volume.

## Trainer
- **Quiz setup now lives under the module** — the standalone Quiz Builder route/nav is gone. Each quiz activity in the module's Content Flow expands to a full setup panel: question template / Excel upload, **completion-vs-pass criteria**, pass mark, time limit, reattempts, shuffle and the mandatory (compliance) flag.
- **Module completion rule** captured separately from each quiz's criteria (all required activities, or additionally pass the pass-criteria quizzes).
- **Publish / unpublish** working for programs, skills and modules (new `PublishControl` + `setPublishState` repository seam; skills gained a publish state).
- **Edit is clickable everywhere** — program cards, skill cards and module rows are links into the editor; module rows carry a clear Edit button.
- **Search / filter** added to the program list (with state chips), program→skills and skill→modules lists — consistent across the surface.
- **Visibility & access** (module Settings) — everyone / target audience / restricted-to-teams, an exclusions list, and a plain-language access summary.
- **Audience table** now shows enrolled-on and pass/fail alongside status; CSV export widened.

## Admin
- **Multi-level assignment flow** (`assignments.tsx`) — assign at **program / skill / module** level (resolves down to modules), to **team(s) (e.g. COE) or specific people**. Pick team(s) → see qualifying users → narrow with multi-level filters (function, designation, manager, grade, location, employee type, status) → search by user → select all → submit.
- **Reports** — by-learner rows now carry enrolled-on, status (incl. in-progress and pass/fail), %, user status, manager, designation, division and function. Added Function / Designation / Manager slicers; filtering is attribute-aware and consistent across tabs.
- **Mandatory under Reports** — a collapsed *Mandatory quiz compliance* section on the Reports index, plus a *Show mandatory quiz completion* toggle inside the Completion Ratio report.

## Overall
- **Section toggle** — a clearly-marked Learner / Trainer / Admin segmented control sits next to the name in the top bar (replaces the buried menu items).
- **Prepared for volume** — tile layouts, collapsed-by-default sections, scrolling user tables with sticky headers.
- **New joiner** badge shows only when it applies (joined within ~120 days), in the directory, the user panel and the assignment picker.
