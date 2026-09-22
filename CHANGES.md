# Lessons — this response's changes only

Everything prior is assumed pushed. Unzip at the repo root and sync. `tsc` + `eslint` clean; no new deps.
16 files — 2 new (`src/lib/module-flow.ts`, `src/routes/browse.tsx`).

## Your list
1. **Certificates scale** — `routes/certificates.tsx` now shows a search box once you have more than a few, a 3-up responsive grid, and separate "no certificates" vs "no matches" states. Per-cert Download/Share and Download-all stay.
2. **Cleaner quiz result** — `scorecard-dialog.tsx` drops the difficulty table; it now shows the score ring, "X of Y correct · pass mark", and a compact Correct / Incorrect / Skipped trio.
3. **Users & Progress columns** — realigned to your spec: **User Name · User ID · User Email · Created On · Allowed Views · User Status · Mobile Number · Department** (Last active removed; Team/Designation/Grade/Manager/Progress dropped from the table — still on the profile/edit drawer).
4. **Report variety** — the five reports are named to match your reference: Completion Ratio Report, Leaderboard Points Report, Time Spent Analytics, Audit Logs, Login Reports (each keeps the Dashboard / By Learner Attributes / By Programs / By Learner / By Modules tabs + custom builder).
5. **Deactivate learners** — a row action **Deactivate (left company)** / **Reactivate** (sets status via `updateUser`), inactive names show struck-through; plus a **Sync from Coefficient** button in the header.
6. **Push-to-all + custom reports** — confirmed present: module Settings → Push enrollment → "Everyone on this skill", and the Reports custom builder. No new work needed; flagging so you know it's covered.
7. **Video/PPT before quiz** — new `lib/module-flow.ts`: a quiz is locked until every earlier video/deck/link is complete (on top of the existing order-lock). Used by the player and the module overview.
8. **Clickable notifications** — the bell items already navigate; now they show an unread dot + a chevron so it's obviously clickable.
9. **Search by type** — `/search` has type chips (All / Videos / Decks & slides / Quizzes / Links) alongside the list/grid + sort controls.
10. **Bulk certificate download** — a **Certificates** (zip) button on the trainer quiz **Results** tab (all who passed) and on the **Mandatory Quizzes** completion view (all completed).
11. **Logo cut-off** — the sidebar now uses a compact lockup (square mark + "NS Lessons") instead of the wide logo, so the wordmark no longer clips.

## New Browse catalog (reachable from Home)
`routes/browse.tsx` — a learner-facing **Program → Skill → Module** tree (each program lists its skills; each skill lists its modules with status + time, linking to the module overview). Reachable from the sidebar (**Browse**) and a "Browse catalog" link on Home.

## Teams
`data/admin-mocks.ts` now uses your real roster — Sales, Presales, Marketing, Business Development, Data Tech, Tech Solutions, Data Analytics and Engineering, Thought Leadership, Info Services, Research, Finance, HR, Admin, PMO, Process Excellence, COE, IT Support, Payroll — across **~120 generated employees**, so the team rollup, leaderboard-by-team and reports feel like a real org.

## Notes
- `routeTree.gen.ts` includes `/browse` (mirrors the generated pattern; the TanStack plugin reproduces it on build).
- Verified via `tsc` + `eslint` + review (the live build needs the private Lovable vite plugin, 403 here; the Tailwind CDN is blocked too). Give the new Browse page, the Users columns, and the quiz-gating a quick look once deployed.
