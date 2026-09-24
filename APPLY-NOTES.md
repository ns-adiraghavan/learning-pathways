# Lessons LMS — quiz + video surgical fixes

Frontend only. No new dependencies. Unzip at the repo root (paths mirror `src/`)
and overwrite. `tsc`/`vite build` clean expected. The backend seam
(`repositories.ts`) is untouched — the new fields are optional and demo-only.

## Sectioning now lives inside the quiz (updated)
Per your note, video "sectioning" is authored in the **quiz interface**, like your
previous platform. A quiz is a set of **sections**; each section holds its own
questions and a **timing**:
- **Part of quiz** — normal assessment questions.
- **At a video point** — the section pops during the video at an `mm:ss` mark.
- **At video end** — the section pops when the video finishes.

The quiz editor is a two-pane view: sections rail on the left, the selected
section's timing + questions on the right. Import/template land into the selected
(or a new) section, and every question stays individually editable. The video
activity panel no longer has its own checkpoint UI — it just points to the quiz.

## Files
- **NEW** `src/lib/video-source.ts` — provider detection (upload/YouTube/Drive), URL parsing, embed URLs, mm:ss helpers.
- **NEW** `src/components/trainer/question-editor.tsx` — full editor for a single question (prompt, variable options, correct-answer picker, difficulty, explanation).
- **NEW** `src/components/trainer/quiz-editor-dialog.tsx` — the two-pane, section-based quiz editor with per-section timing.
- `src/data/types.ts` — added `VideoProvider`, `SectionTiming`, `QuizSection`, `VideoCheckpoint`; `provider`/`checkpoints` on `VideoActivity`; and `sections`/video/deck/link fields on `DraftActivity` (all optional).
- `src/lib/quiz-template.ts` — added `parseQuizTemplateCsv()` so a CSV import lands as editable questions.
- `src/components/trainer/content-flow-tab.tsx` — per-type setup panels: video source (upload/YouTube/Drive) + duration; document/slides upload; link URL; and the section-based quiz panel.
- `src/components/lessons/activities/video-activity.tsx` — no-skip player + YouTube/Drive embeds + in-video question rendering.
- `src/data/trainer-mocks.ts` — the demo "Assessment" quiz now has two sections (one timed to the video @2:30, one final assessment) so the section editor shows content.
- `src/data/mocks.ts` — the demo learner video shows the popped-question behaviour.

## Ask-by-ask
1. **Sophisticated quiz + sectioning** — import/template opens the full section editor; edit each question individually; group into sections; each section's timing gives you the video pop points.
2. **No skip / fast-forward** — uploaded video has native controls removed + a display-only progress bar; seeking is clamped to the furthest point watched. YouTube is embedded with the scrubber + keyboard seeking suppressed; Google Drive uses its preview player (provider-native seeking can't be fully blocked from the frontend).
3. **Video embed** — trainer picks Upload / YouTube / Drive; links validated; player renders each.
4. **Upload within an activity** — video = Upload video (+ links); document/slides = Upload file (PDF/PPT/PPTX/DOC/DOCX); link = URL.

## Backend to wire later (out of scope now)
- Persist uploaded files and store URLs; persist `sections` (with timing) and `provider`/`sourceUrl` on save.
- Deliver quiz sections to the learner: pass "video-point"/"video-end" sections through to the video player so they pop during playback (today the learner demo uses mock checkpoints on the video to illustrate the result).
- `.xlsx` import currently asks the trainer to save as CSV; real xlsx parsing belongs on the server (or add SheetJS for client-side).
- YouTube true no-seek + progress tracking would use the YouTube IFrame Player API.
