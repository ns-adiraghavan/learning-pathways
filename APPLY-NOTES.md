# Lessons LMS — quiz + video surgical fixes

Frontend only. No new dependencies. Unzip at the repo root (paths mirror `src/`)
and overwrite. `tsc`/`vite build` clean expected. The backend seam
(`repositories.ts`) is untouched — the new fields are optional and demo-only.

## Files
- **NEW** `src/lib/video-source.ts` — provider detection (upload/YouTube/Drive), URL parsing, embed URLs, mm:ss helpers.
- **NEW** `src/components/trainer/question-editor.tsx` — full editor for a single question (prompt, variable options, correct-answer picker, difficulty, explanation).
- **NEW** `src/components/trainer/quiz-editor-dialog.tsx` — the "full view" quiz editor; import/template/blank all open here, every question editable.
- `src/data/types.ts` — added `VideoProvider`, `VideoCheckpoint`, video-source + `checkpoints` on `VideoActivity`, and editable `questions`/video/deck/link fields on `DraftActivity` (all optional).
- `src/lib/quiz-template.ts` — added `parseQuizTemplateCsv()` so a CSV import lands as editable questions.
- `src/components/trainer/content-flow-tab.tsx` — per-type setup panels (video source + duration + in-video questions; document/slides upload; link URL; quiz question editor entry).
- `src/components/lessons/activities/video-activity.tsx` — no-skip player + YouTube/Drive embeds + in-video question checkpoints.
- `src/data/mocks.ts` — one demo video gets two checkpoints (at 0:05 and at end) so the behaviour is visible immediately.

## What each ask maps to
1. **Sophisticated quiz** — import/template now opens the full editor dialog; edit each question individually (prompt, options, correct answer, difficulty, explanation), add/delete, re-import. **Video sectioning:** per video activity, "In-video questions" — add a question at a mm:ss point or "At the end".
2. **No skip / fast-forward** — direct-upload video renders with native controls removed and a display-only progress bar; seeking is clamped to the furthest point watched. (YouTube is embedded with the scrubber + keyboard seeking suppressed; Google Drive uses its preview player — provider-native seeking there can't be fully blocked from the frontend.)
3. **Video embed** — trainer picks Upload / YouTube / Drive; links are validated; the player renders each correctly.
4. **Upload within an activity** — each activity now has an editor body: video = Upload video (+ YouTube/Drive), document/slides = Upload file (PDF/PPT/PPTX/DOC/DOCX), link = URL.

## Backend to wire later (out of scope now)
- Persist uploaded files (video/doc) and store their URLs; persist `checkpoints`, `questions`, `provider`, `sourceUrl` on save.
- Map `DraftActivity.checkpoints`/`questions` through to the learner-facing `Activity` shape.
- `.xlsx` import currently asks the trainer to save as CSV; real xlsx parsing belongs on the server (or add SheetJS if you want it client-side).
- YouTube true no-seek + progress tracking would need the YouTube IFrame Player API.
