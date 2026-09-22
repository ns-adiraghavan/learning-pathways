# Lessons — pass-mark wire-through (follow-up to batch 4)

Everything prior is assumed pushed. Unzip at the repo root and sync. `tsc` + `eslint` clean; no new deps. 4 files, all edits (no new files).

## What changed
The trainer's per-quiz **Passing %** now flows all the way through to learner scoring, instead of only living in the builder's local state.

- **`data/types.ts`** — `DraftActivity` gained an optional `passingPct` (quiz only).
- **`components/trainer/content-flow-tab.tsx`** — each quiz activity row now has an editable **Pass %** field (0–100) beside the Mandatory / Required toggles, so the pass mark is set where the trainer builds the module's activity flow.
- **`data/repositories.ts`** — a session-level `quizPassMarkStore` (keyed by quiz activity id) is the bridge:
  - `saveModuleDraft` writes each quiz's `passingPct` into the store on Save.
  - `submitQuiz` resolves the pass mark as **store → the quiz's own `passingPct` → 70%**, so scoring reflects what the trainer set.
  - `getModule` overlays the stored pass mark onto the quiz activity, so the learner's quiz start screen and scorecard show the trainer's value.
- **`data/trainer-mocks.ts`** — the seeded draft "Assessment" quiz carries a default `passingPct: 70` so the field is populated out of the box.

## Note on the demo data
The trainer draft modules and the learner-facing modules are seeded as separate mock sets with different activity ids (`<moduleId>-a4` vs `a-welcome-4`, etc.). The mechanism above is real and correct — it keys on the quiz activity id, so a saved pass mark takes effect for the learner quiz of that same id and for any quiz authored with a matching id. Once the real backend replaces these mocks (draft and published module share one id), the trainer's Pass % edit will change that exact quiz's scoring end to end with no further work. Verified via `tsc` (0 errors) + `eslint` (0 issues).
