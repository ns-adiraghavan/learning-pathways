# Lessons — data layer integration map

All UI reads data **only** through `src/data/repositories.ts`. Nothing imports
`mocks.ts` directly. Swapping in the real backend means replacing each function
body below with a `fetch` call — every call site already awaits a Promise.

- `types.ts` — canonical TypeScript shapes (the API contract).
- `mocks.ts` — demo records only.
- `config.ts` — `EMPTY_STATE` (set `true` to render every empty state) and mock latency.
- `repositories.ts` — the only surface the UI touches. Each function carries a
  `// CONNECT: replace with real API call to <endpoint>` marker.

## Functions

| Function | Returns (see `types.ts`) | Endpoint marker |
| --- | --- | --- |
| `getCurrentUser()` | `User \| null` | `GET /api/me` |
| `getAssignedModules()` | `LearningModule[]` | `GET /api/me/modules` |
| `getModule(id)` | `LearningModule \| null` | `GET /api/modules/:id` |
| `getModuleProgress(id)` | `ModuleProgress \| null` | `GET /api/modules/:id/progress` |
| `completeActivity(moduleId, activityId)` | `ModuleProgress \| null` | `POST /api/modules/:id/activities/:activityId/complete` |
| `submitQuiz(quizId, answers)` | `QuizResult` | `POST /api/quizzes/:id/submit` |
| `getPendingActions()` | `PendingAction[]` | `GET /api/me/pending-actions` |
| `getCertificates()` | `Certificate[]` | `GET /api/me/certificates` |
| `getLeaderboard()` | `LeaderboardEntry[]` | `GET /api/leaderboard` |
| `getNotifications()` | `Notification[]` | `GET /api/me/notifications` |
| `getProgressSummary()` | `ProgressSummary` | `GET /api/me/progress-summary` |
| `searchModules(query)` | `LearningModule[]` | `GET /api/search?q=` |

## Notes for the backend team

- `answers` in `submitQuiz` is `Record<questionId, optionId \| null>`; `null`
  means unanswered. Scoring, pass mark (70%) and the difficulty breakup are
  computed server-side in the real implementation.
- `LearningModule.activities` is an **ordered** array of discriminated-union
  activities (`video | deck | weblink | quiz`). The course player walks the
  array; a quiz is not special-cased, so it works mid-sequence or at the end.
- `orderLocked` on a module tells the player whether steps may be skipped.
- While mocked, `completeActivity` keeps progress in an in-memory map so the
  player updates live within a session. Delete that map when the API lands.

## Trainer functions

Trainer demo records live in `trainer-mocks.ts`; types are in the TRAINER section
of `types.ts`. Content is organised **Program → Skill → Module**. Every function
below honours `EMPTY_STATE`.

| Function | Returns (see `types.ts`) | Endpoint marker |
| --- | --- | --- |
| `getPrograms()` | `Program[]` | `GET /api/trainer/programs` |
| `getProgram(id)` | `{ program: Program; skills: Skill[] } \| null` | `GET /api/trainer/programs/:id` |
| `getSkill(id)` | `{ skill: Skill; modules: TrainerModuleSummary[] } \| null` | `GET /api/trainer/skills/:id` |
| `getModuleDraft(id)` | `ModuleDraft \| null` | `GET /api/trainer/modules/:id/draft` |
| `saveModuleDraft(draft)` | `ModuleDraft` | `PUT /api/trainer/modules/:id/draft` |
| `getEnrolledLearners(moduleId)` | `EnrolledLearner[]` | `GET /api/trainer/modules/:id/learners` |
| `getModuleAnalytics(moduleId)` | `ModuleAnalytics` | `GET /api/trainer/modules/:id/analytics` |
| `bulkLearnerAction(moduleId, learnerIds, action)` | `{ affected, action }` | `POST /api/trainer/modules/:id/learners/bulk` |
| `reassignLearner(moduleId, learnerId)` | `{ moduleId, learnerId, reset }` | `POST /api/trainer/modules/:id/learners/:learnerId/reassign` |
| `getQuizTemplates()` | `QuizTemplate[]` | `GET /api/trainer/quiz-templates` |
| `getCertificateTemplates()` | `CertificateTemplate[]` | `GET /api/trainer/certificate-templates` |
| `getFeedbackSurveys()` | `FeedbackSurvey[]` | `GET /api/trainer/feedback-surveys` |
| `getTemplateQuestions(templateId)` | `BuilderQuestion[]` | `GET /api/trainer/quiz-templates/:id/questions` |
| `getQuizResults(quizId)` | `QuizResultRow[]` | `GET /api/trainer/quizzes/:id/results` |

### Notes for the backend team

- `ModuleDraft.activities` is the authored order; the learner player consumes the
  same order. `draft: true` on an activity means it is hidden from learners.
- `ModuleSettings.dueMode` is either `fixed` (`dueDate`) or `relative`
  (`dueWithinDays` after the learner joins) — this drives mandatory vs onboarding
  due logic.
- `bulkLearnerAction` covers `remind | unenroll | change-due-date`; `reassignLearner`
  is the single-learner reset (clears progress and re-issues the assignment).
- `Notification.linkTo` is an in-app route the client navigates to on click.
- Certificate templates and quiz templates are **pre-built assets**; the trainer
  only picks one by id (`certificateTemplateId`, `QuizTemplate.id`).
- While mocked, `saveModuleDraft` keeps drafts in an in-memory map. Delete that
  map when the API lands.

## Admin functions

Admin demo records live in `admin-mocks.ts`; types are in the ADMIN section of
`types.ts`. The admin surface is deliberately small — users & progress,
assignments, reports, light customization. Every read honours `EMPTY_STATE`.

| Function | Returns (see `types.ts`) | Endpoint marker |
| --- | --- | --- |
| `getUsers(query?)` | `AdminUser[]` | `GET /api/admin/users?q=` |
| `getUser(id)` | `AdminUser \| null` | `GET /api/admin/users/:id` |
| `getUserProgress(id)` | `UserProgressItem[]` | `GET /api/admin/users/:id/progress` |
| `addUser(input)` | `AdminUser` | `POST /api/admin/users` |
| `getAssignableModules()` | `AssignableModule[]` | `GET /api/admin/modules` |
| `getModuleAssignments(moduleId)` | `ModuleAssignment[]` | `GET /api/admin/modules/:id/assignments` |
| `updateAssignment(moduleId, change)` | `ModuleAssignment[]` | `PUT /api/admin/modules/:id/assignments` |
| `getReports()` | `ReportSummary[]` | `GET /api/admin/reports` |
| `getReport(id, filters?)` | `ReportDetail \| null` | `GET /api/admin/reports/:id?period=&department=&location=` |
| `getPlatformSettings()` | `PlatformSettings` | `GET /api/admin/settings` |
| `savePlatformSettings(settings)` | `PlatformSettings` | `PUT /api/admin/settings` |

### Notes for the backend team

- Users are normally **auto-provisioned** (`provisioned: "auto"`); `addUser` is a
  manual convenience for exceptions.
- `updateAssignment` takes one change at a time: `add`, `remove`
  (`assignmentIds`) or `due-date` (`assignmentIds` + `dueDate`). An assignment
  row is either a person (`kind: "user"`) or a whole team (`kind: "team"`,
  `headcount` people).
- `ReportDetail.columns` drives the results table; `numeric: true` columns are
  right-aligned with tabular figures. Report ids are fixed:
  `completion-ratio | time-spent | leaderboard-points | audit-log`.
- Export and Schedule are UI actions only while mocked.
- While mocked, assignment edits, added users and saved settings live in
  in-memory maps. Delete them when the API lands.

## Mandatory quiz compliance

Demo records live in `compliance-mocks.ts`; types are in the MANDATORY QUIZ
COMPLIANCE section of `types.ts`. A quiz carries `mandatory: boolean`
(compliance-tracked org-wide) alongside `required: boolean` (needed to finish
the module) — the two are independent. Every read honours `EMPTY_STATE`.

| Function | Returns (see `types.ts`) | Endpoint marker |
| --- | --- | --- |
| `getMandatoryQuizzes()` | `MandatoryQuiz[]` | `GET /api/admin/mandatory-quizzes` |
| `getQuizCompletion(quizId)` | `QuizCompletionRow[]` | `GET /api/quizzes/:id/completion` |
| `setQuizMandatory(quizId, mandatory)` | `{ quizId, mandatory }` | `PUT /api/quizzes/:id/mandatory` |
| `sendQuizReminder(quizId, learnerIds)` | `{ sent: number }` | `POST /api/quizzes/:id/reminders` |

### Notes for the backend team

- `QuizCompletionRow.status` is `completed | not-completed`; `completedOn`,
  `scorePct` and `lastRemindedOn` are `null` when they do not apply.
- CSV downloads are generated client-side from the rows already returned — no
  export endpoint is needed.
- While mocked, mandatory flags and reminder timestamps live in in-memory maps.
  Delete them when the API lands.
