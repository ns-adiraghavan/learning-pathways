# Lessons — this response's changes only

Everything prior is assumed pushed. Unzip at the repo root and sync. `tsc` + `eslint` clean; no new deps.
16 files — 1 new (`src/data/org.ts`). No new routes, so `routeTree.gen.ts` is untouched.

## Your list

1. **Assignment search** — the Assignments module picker is now a search box (searches **program, skill and module** together) over a scrollable, single-select list showing each module's `Program › Skill` and enrolled count. The selected module is confirmed above the assignment table. (`routes/admin/assignments.tsx`; `AssignableModule` gained a `skillTitle`.)

2. **Quiz pass/fail is explicit + certs follow the team filter** —
   - Mandatory-quiz compliance page now has a **Result** column (Pass/Fail chip), the score is coloured by pass/fail, and the header shows the **pass mark**. The CSV export gained a Result column too.
   - **Certificates now respect the team filter.** The button was zipping *all* completed learners regardless of the team dropdown; it now certifies only those in the current team filter **who passed**, and the button count + toast reflect that scope.
   - Trainer quiz **Results** tab gained an explicit Pass/Fail chip alongside the score.

3. **Enrollment rules are editable** — the Customization → Enrollment rules section can now **add, edit and remove** rules inline: attribute dropdown (Department / Employee type / Location / Function / Division / Grade / Designation), an editable match value, an editable target module, an enable toggle and a delete button. Save is disabled until every rule is complete. (`components/admin/config-sections.tsx`.)

4. **Function + Division org model (the correction)** — new `data/org.ts` holds the taxonomy: the 18 teams are **Divisions**, each rolling up to a **Function** — **Sales** (Marketing, Sales, Presales, Business Development), **Operations** (Data Tech, Tech Solutions, Data Analytics and Engineering, Thought Leadership, Info Services, Research), **Support** (Finance, HR, Admin, PMO, Process Excellence, COE, IT Support, Payroll). Each employee's `functionArea` is now **derived from their division**, never assigned independently. The stale rosters are fixed everywhere they showed: the **leaderboard** entries, the **current user**, and the **trainer** learner/quiz-result rosters now use real divisions. The **leaderboard** also gained a third view, **By function**, that rolls divisions up (with a per-function CSV), and the individual/team CSVs now carry the Function column. New-user creation and the CSV import sample were realigned too.

5. **Clickable stat tiles** — Home ribbon tiles now navigate: **Completed** → My Learning (completed), **In progress** → My Learning (in-progress), **Certificates** → Certificates, **XP points** → Leaderboard. My Learning's completion-by-category cards are now filter buttons — tap one to filter the list to that category, tap again to clear.

6. **Quiz scoring = correct ÷ total, pass mark set by the trainer** — score is already correct-over-total; the **pass mark is no longer hard-coded at 70%**. Quizzes carry a `passingPct` (set per quiz, e.g. 60/70/75/80 in the seed data), `submitQuiz` uses it, the learner sees the pass mark on the quiz start screen, and the scorecard reports against it. The trainer's Quiz builder already exposes the Passing % control.

7. **Audience & Analytics advanced search** — the trainer module editor's Audience & Analytics tab gained a free-text search (name / user ID / email) and a **Filters** panel matching the admin directory: Team/Division, Function, Designation, Department, Location, Employee type, Grade, Manager and Joined-on/after. Enrolled-learner records were enriched with those attributes so the search is real, not cosmetic.

## Notes
- Verified via `tsc` (0 errors) + `eslint` (0 issues). The live build still needs the private Lovable vite plugin (403 here) and the Tailwind CDN is blocked, so give the Assignments picker, the mandatory-quiz Result/cert-filter behaviour, the editable enrollment rules and the leaderboard "By function" view a quick look once deployed.
- `data/org.ts` is the single source of truth for the Division→Function mapping — point new team/reporting code at `functionForDivision()` rather than re-hardcoding the roster.
