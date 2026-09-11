# Learning Pathways

Build "Lessons", an internal learning platform (LMS) for Netscribes, in React + TypeScript + Tailwind + shadcn/ui. This first prompt sets up the whole design system, a swappable mock-data layer, the app shell, and the complete LEARNER experience. Keep the interface clean, calm, and simple — think Linear's precision but in a light theme.

DESIGN SYSTEM (apply globally via shadcn CSS variables in index.css):

- Light default, with a dark-mode toggle (class strategy). Define :root (light) and .dark blocks.

- LIGHT tokens: --background #f6f7f8; --foreground #101113; --card #ffffff; --popover #ffffff; --primary #0d9488 (teal-blue); --primary-foreground #ffffff; --secondary #f0f1f3; --muted #f0f1f3; --muted-foreground #62666d; --accent #eef0f2; --destructive #eb5757; --border #e5e7eb; --input #e5e7eb; --ring #0d9488.

- DARK tokens: --background #08090a; --foreground #ffffff; --card #0f1011; --popover #161718; --primary #2dd4bf; --primary-foreground #08090a; --secondary rgba(255,255,255,.05); --muted rgba(255,255,255,.05); --muted-foreground #8a8f98; --border #23252a; --input rgba(255,255,255,.08); --ring #2dd4bf.

- Typography: Inter (variable) everywhere, NO monospace anywhere. Weights only 400/510/590. Numbers (scores, timers, counts) use font-variant-numeric: tabular-nums. Body 15px/1.6; card titles 16px/510; page titles 24px/510; labels 13px/510.

- Radii: cards 12px, buttons/inputs 6px, badges 4px, pills full. Separate surfaces with 1px --border hairlines, NOT shadows (shadows only on dialogs/popovers/dropdowns).

- Status colors (use as small dot/badge/left-border fills only, never body text): complete #27a644, in-progress = primary teal, overdue #eb5757, mandatory #6366f1, category #8b5cf6, quiz difficulty easy #27a644 / medium #f59e0b / hard #eb5757.

- MOTION — the only place animation lives, all ~150–250ms ease-out, all gated behind prefers-reduced-motion: progress ring/bar filling, activity-complete checkmark, course-player step transitions (slide+fade), scorecard % counting up. No hover lifts, no decorative motion. Card hover just brightens the border.

DATA LAYER (critical — this is how the real backend will connect later):

- Put ALL data in src/data/. Define TypeScript types in src/data/types.ts. Put mock/demo records in src/data/mocks.ts. Expose the app's data through repository functions in src/data/repositories.ts (e.g. getCurrentUser(), getAssignedModules(), getModule(id), getModuleProgress(id), submitQuiz(id, answers), getLeaderboard()). Every screen and component reads data ONLY through these repository functions — never import mocks directly into UI.

- Add src/data/config.ts exporting `EMPTY_STATE: boolean` (default false). When true, every repository returns empty/blank results so all screens render their designed empty states. When false, they return the demo data.

- Generate src/data/README.md documenting: each repository function, the shape it returns (referencing types.ts), and a clear "// CONNECT: replace with real API call to <endpoint>" marker for each. This file is the integration map for the backend team.

- Simulate async (Promise + small delay) so swapping to real fetch calls later is a drop-in.

APP SHELL:

- Collapsible left sidebar + top bar (seed from a shadcn dashboard/sidebar block). Sidebar nav for the LEARNER: Home, My Learning, Progress, Leaderboard, Certificates.

- Top bar: global search input, notifications bell, dark-mode toggle, profile menu (Profile, Completed Modules, view switcher placeholder "Switch to Trainer/Admin View", Logout).

- "Lessons" wordmark in the sidebar header.

CONTENT MODEL: A learner is assigned Modules. A Module has: title, description, posterImage, category (one of: onboarding | mandatory | team | bank), dueDate, status (not-started | in-progress | complete | overdue), progressPct, and an ORDERED list of activities. An Activity is one of these typed shapes: {type:'video', src, durationMins, required, enforceFocus} | {type:'deck', src, pages, required} | {type:'weblink', url, required} | {type:'quiz', templateId, questions, required, timeLimitMins, shuffle}. Seed ~8 demo modules spread across the 4 categories, each with 2–4 activities incl. at least one quiz.

LEARNER SCREENS:

1. Home ("at a glance"): a "Continue / Due soon" row of module cards at top (prioritize overdue+mandatory), then sections grouped by category (Mandatory, Onboarding, Team, Course Bank). Each module card: poster, title, category badge, a progress RING (animated), due date, status dot. Pending-actions strip (surveys/eSignatures) as small cards. Empty state: friendly "You're all caught up / nothing assigned yet" panel.

2. My Learning: list/grid of in-progress modules with % progress bar + due date + Resume button.

3. Progress: a simple standing — big "X of Y modules complete" with an animated progress bar, split Mandatory vs Optional. Small counts, no heavy charts.

4. Module detail: poster, About (collapsible "See More"), and the ordered Activity list — each row shows icon, name, meta (runtime/pages/#questions), a Required badge, and a Continue button. A module-level progress bar on top.

5. Course player: a focused full-width player that renders the activities IN ORDER using a stepper/lifecycle pattern. It reads activities[] and an orderLocked flag; calling an activity's onComplete() advances to the next step (animated transition) and fills the module progress bar. Because quiz is just another activity in the array, quizzes work both mid-sequence and at the end with no special-casing.

   - Video activity: player with progress bar; if enforceFocus is true, PAUSE and show a "Paused — return to the video to continue" overlay when the tab loses focus or the user is idle (document visibilitychange + blur). Mark complete only after watched to end.

   - Deck activity: paginated viewer ("Page X of Y"), Next/Prev, a "Mark as Complete" button (enabled after last page), full-screen toggle.

   - Weblink activity: card with the link + a "Mark as visited" action.

   - Quiz activity: one question at a time, options, a countdown timer (tabular-nums), optional shuffled order; on submit show a SCORECARD dialog — PASSED/FAILED, a % ring that counts up, and a breakup by difficulty (Easy/Medium/Hard: total, right, wrong, unanswered), plus a Done button.

6. Certificates: grid of earned certificates + a "Pending eSignatures" list. Empty state included.

Make every list/grid have a proper empty state (used when EMPTY_STATE is true). Use tasteful demo data by default. Keep it responsive down to ~400px. Do not add gamification beyond Leaderboard + Certificates. Prioritize a clean, uncluttered layout with generous whitespace and the animations above done smoothly.

I've attached the NS logo to use as well.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9e4d3da0-40d3-4805-bd46-39f73a9f9d5f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
