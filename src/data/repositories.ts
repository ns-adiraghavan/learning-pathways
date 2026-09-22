/**
 * Lessons — data access layer.
 * UI code reads data ONLY through these functions. See README.md in this folder
 * for the integration map used by the backend team.
 */

import { EMPTY_STATE, MOCK_LATENCY_MS } from "./config";
import {
  certificates as mockCertificates,
  currentUser as mockCurrentUser,
  leaderboard as mockLeaderboard,
  modules as mockModules,
  notifications as mockNotifications,
  pendingActions as mockPendingActions,
} from "./mocks";
import {
  builderQuestions as mockBuilderQuestions,
  certificateTemplates as mockCertificateTemplates,
  draftFor,
  feedbackSurveys as mockFeedbackSurveys,
  learnersFor,
  programs as mockPrograms,
  quizResultsFor,
  quizTemplates as mockQuizTemplates,
  skills as mockSkills,
  trainerModules as mockTrainerModules,
} from "./trainer-mocks";
import {
  assignableModules as mockAssignableModules,
  assignmentsFor,
  enrollmentRules as mockEnrollmentRules,
  notificationSettings as mockNotificationSettings,
  platformSettings as mockPlatformSettings,
  pointsRules as mockPointsRules,
  progressFor as userProgressFor,
  reportDetail,
  reports as mockReports,
  users as mockUsers,
} from "./admin-mocks";
import { completionFor, mandatoryQuizzes as mockMandatoryQuizzes } from "./compliance-mocks";
import { functionForDivision } from "./org";
import type {
  Certificate,
  DifficultyBreakup,
  Difficulty,
  LeaderboardEntry,
  LearningModule,
  ModuleProgress,
  Notification,
  PendingAction,
  ProgressSummary,
  QuizActivity,
  QuizResult,
  User,
  BuilderQuestion,
  CertificateTemplate,
  EnrolledLearner,
  FeedbackSurvey,
  ModuleAnalytics,
  ModuleDraft,
  Program,
  QuizResultRow,
  QuizTemplate,
  Skill,
  TrainerModuleSummary,
  AdminRole,
  AdminUser,
  AssignableModule,
  ModuleAssignment,
  PlatformSettings,
  ReportDetail,
  ReportFilters,
  ReportId,
  ReportSummary,
  UserProgressItem,
  UserFilters,
  CustomReportSpec,
  NotificationSetting,
  EnrollmentRule,
  PointsRule,
  MandatoryQuiz,
  QuizCompletionRow,
} from "./types";

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

/** In-session progress overrides, so the player feels live before a real API exists. */
const progressStore = new Map<string, ModuleProgress>();

function baseProgress(module: LearningModule): ModuleProgress {
  const completedCount = Math.round((module.progressPct / 100) * module.activities.length);
  return {
    moduleId: module.id,
    progressPct: module.progressPct,
    status: module.status,
    completedActivityIds: module.activities.slice(0, completedCount).map((a) => a.id),
  };
}

// CONNECT: replace with real API call to GET /api/me
export async function getCurrentUser(): Promise<User | null> {
  if (EMPTY_STATE) return delay(null);
  return delay(mockCurrentUser);
}

// CONNECT: replace with real API call to GET /api/me/modules
export async function getAssignedModules(): Promise<LearningModule[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(mockModules);
}

/**
 * Trainer-set quiz pass marks, keyed by quiz activity id. Written when a module
 * draft is saved (see saveModuleDraft) and read by both getModule (so the learner
 * sees the right pass mark) and submitQuiz (so scoring uses it).
 */
const quizPassMarkStore = new Map<string, number>();

function applyQuizPassMarks(module: LearningModule): LearningModule {
  if (![...quizPassMarkStore.keys()].some((id) => module.activities.some((a) => a.id === id))) {
    return module;
  }
  return {
    ...module,
    activities: module.activities.map((a) =>
      a.type === "quiz" && quizPassMarkStore.has(a.id)
        ? { ...a, passingPct: quizPassMarkStore.get(a.id)! }
        : a,
    ),
  };
}

// CONNECT: replace with real API call to GET /api/modules/:id
export async function getModule(id: string): Promise<LearningModule | null> {
  if (EMPTY_STATE) return delay(null);
  const module = mockModules.find((m) => m.id === id);
  return delay(module ? applyQuizPassMarks(module) : null);
}

// CONNECT: replace with real API call to GET /api/modules/:id/progress
export async function getModuleProgress(id: string): Promise<ModuleProgress | null> {
  if (EMPTY_STATE) return delay(null);
  const stored = progressStore.get(id);
  if (stored) return delay(stored);
  const module = mockModules.find((m) => m.id === id);
  return delay(module ? baseProgress(module) : null);
}

// CONNECT: replace with real API call to POST /api/modules/:id/activities/:activityId/complete
export async function completeActivity(
  moduleId: string,
  activityId: string,
): Promise<ModuleProgress | null> {
  const module = mockModules.find((m) => m.id === moduleId);
  if (!module) return delay(null);

  const current = progressStore.get(moduleId) ?? baseProgress(module);
  const completedActivityIds = current.completedActivityIds.includes(activityId)
    ? current.completedActivityIds
    : [...current.completedActivityIds, activityId];
  const progressPct = Math.round((completedActivityIds.length / module.activities.length) * 100);

  const next: ModuleProgress = {
    moduleId,
    completedActivityIds,
    progressPct,
    status: progressPct >= 100 ? "complete" : "in-progress",
  };
  progressStore.set(moduleId, next);
  return delay(next);
}

// CONNECT: replace with real API call to POST /api/quizzes/:id/submit
export async function submitQuiz(
  quizId: string,
  answers: Record<string, string | null>,
): Promise<QuizResult> {
  const quiz = mockModules
    .flatMap((m) => m.activities)
    .find((a): a is QuizActivity => a.type === "quiz" && a.id === quizId);

  const questions = quiz?.questions ?? [];
  const order: Difficulty[] = ["easy", "medium", "hard"];
  const breakup: DifficultyBreakup[] = order.map((difficulty) => {
    const set = questions.filter((qq) => qq.difficulty === difficulty);
    let right = 0;
    let wrong = 0;
    let unanswered = 0;
    for (const question of set) {
      const answer = answers[question.id];
      if (!answer) unanswered += 1;
      else if (answer === question.correctOptionId) right += 1;
      else wrong += 1;
    }
    return { difficulty, total: set.length, right, wrong, unanswered };
  });

  const right = breakup.reduce((sum, b) => sum + b.right, 0);
  const scorePct = questions.length ? Math.round((right / questions.length) * 100) : 0;
  // Pass mark is set by the trainer on the quiz (draft save persists it here),
  // then the quiz's own value, then a 70% fallback.
  const passMarkPct = quizPassMarkStore.get(quizId) ?? quiz?.passingPct ?? 70;

  return delay({
    quizId,
    scorePct,
    passed: scorePct >= passMarkPct,
    passMarkPct,
    totalQuestions: questions.length,
    breakup,
  });
}

// CONNECT: replace with real API call to GET /api/me/pending-actions
export async function getPendingActions(): Promise<PendingAction[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(mockPendingActions);
}

// CONNECT: replace with real API call to GET /api/me/certificates
export async function getCertificates(): Promise<Certificate[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(mockCertificates);
}

// CONNECT: replace with real API call to GET /api/leaderboard
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(mockLeaderboard);
}

// CONNECT: replace with real API call to GET /api/me/notifications
export async function getNotifications(): Promise<Notification[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(mockNotifications);
}

// CONNECT: replace with real API call to GET /api/me/progress-summary
export async function getProgressSummary(): Promise<ProgressSummary> {
  if (EMPTY_STATE) {
    return delay({
      totalModules: 0,
      completedModules: 0,
      mandatoryTotal: 0,
      mandatoryComplete: 0,
      optionalTotal: 0,
      optionalComplete: 0,
      overdueCount: 0,
      inProgressCount: 0,
    });
  }

  const withLive = mockModules.map((m) => {
    const stored = progressStore.get(m.id);
    return stored ? { ...m, status: stored.status, progressPct: stored.progressPct } : m;
  });
  const mandatory = withLive.filter((m) => m.category === "mandatory");
  const optional = withLive.filter((m) => m.category !== "mandatory");

  return delay({
    totalModules: withLive.length,
    completedModules: withLive.filter((m) => m.status === "complete").length,
    mandatoryTotal: mandatory.length,
    mandatoryComplete: mandatory.filter((m) => m.status === "complete").length,
    optionalTotal: optional.length,
    optionalComplete: optional.filter((m) => m.status === "complete").length,
    overdueCount: withLive.filter((m) => m.status === "overdue").length,
    inProgressCount: withLive.filter((m) => m.status === "in-progress").length,
  });
}

// CONNECT: replace with real API call to GET /api/search?q=
export async function searchModules(query: string): Promise<LearningModule[]> {
  if (EMPTY_STATE || !query.trim()) return delay([]);
  const q = query.toLowerCase();
  return delay(
    mockModules.filter(
      (m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
    ),
  );
}

/* ============================================================
 * TRAINER repositories — Program → Skill → Module.
 * ============================================================ */

// CONNECT: replace with real API call to GET /api/trainer/programs
export async function getPrograms(): Promise<Program[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(mockPrograms);
}

// CONNECT: replace with real API call to GET /api/trainer/programs/:id
export async function getProgram(
  id: string,
): Promise<{ program: Program; skills: Skill[] } | null> {
  if (EMPTY_STATE) return delay(null);
  const program = mockPrograms.find((p) => p.id === id);
  if (!program) return delay(null);
  return delay({ program, skills: mockSkills.filter((s) => s.programId === id) });
}

// CONNECT: replace with real API call to GET /api/trainer/skills/:id
export async function getSkill(
  id: string,
): Promise<{ skill: Skill; modules: TrainerModuleSummary[] } | null> {
  if (EMPTY_STATE) return delay(null);
  const skill = mockSkills.find((s) => s.id === id);
  if (!skill) return delay(null);
  return delay({ skill, modules: mockTrainerModules.filter((m) => m.skillId === id) });
}

/** In-session draft overrides so the editor feels live before a real API exists. */
const draftStore = new Map<string, ModuleDraft>();

// CONNECT: replace with real API call to GET /api/trainer/modules/:id/draft
export async function getModuleDraft(id: string): Promise<ModuleDraft | null> {
  if (EMPTY_STATE) return delay(null);
  const stored = draftStore.get(id);
  if (stored) return delay(stored);
  const summary = mockTrainerModules.find((m) => m.id === id);
  return delay(summary ? draftFor(summary) : null);
}

// CONNECT: replace with real API call to PUT /api/trainer/modules/:id/draft
export async function saveModuleDraft(draft: ModuleDraft): Promise<ModuleDraft> {
  draftStore.set(draft.id, draft);
  // Persist each quiz's pass mark so learner scoring (submitQuiz) uses it.
  for (const a of draft.activities) {
    if (a.type === "quiz" && typeof a.passingPct === "number") {
      quizPassMarkStore.set(a.id, a.passingPct);
    }
  }
  return delay(draft);
}

// CONNECT: replace with real API call to GET /api/trainer/modules/:id/learners
export async function getEnrolledLearners(moduleId: string): Promise<EnrolledLearner[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(learnersFor(moduleId));
}

// CONNECT: replace with real API call to GET /api/trainer/modules/:id/analytics
export async function getModuleAnalytics(moduleId: string): Promise<ModuleAnalytics> {
  if (EMPTY_STATE) {
    return delay({
      enrolled: 0,
      completionPct: 0,
      passRatePct: 0,
      avgTimeMins: 0,
      notStarted: 0,
      inProgress: 0,
      complete: 0,
    });
  }
  const learners = learnersFor(moduleId);
  const complete = learners.filter((l) => l.status === "complete").length;
  const inProgress = learners.filter((l) => l.status === "in-progress").length;
  return delay({
    enrolled: learners.length,
    completionPct: Math.round((complete / learners.length) * 100),
    passRatePct: 82,
    avgTimeMins: 34,
    notStarted: learners.length - complete - inProgress,
    inProgress,
    complete,
  });
}

// CONNECT: replace with real API call to POST /api/trainer/modules/:id/learners/bulk
export async function bulkLearnerAction(
  moduleId: string,
  learnerIds: string[],
  action: "remind" | "unenroll" | "change-due-date",
): Promise<{ affected: number; action: string }> {
  return delay({ affected: learnerIds.length, action });
}

// CONNECT: replace with real API call to GET /api/trainer/quiz-templates
export async function getQuizTemplates(): Promise<QuizTemplate[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(mockQuizTemplates);
}

// CONNECT: replace with real API call to GET /api/trainer/certificate-templates
export async function getCertificateTemplates(): Promise<CertificateTemplate[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(mockCertificateTemplates);
}

// CONNECT: replace with real API call to GET /api/trainer/feedback-surveys
export async function getFeedbackSurveys(): Promise<FeedbackSurvey[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(mockFeedbackSurveys);
}

// CONNECT: replace with real API call to POST /api/trainer/modules/:id/learners/:learnerId/reassign
export async function reassignLearner(
  moduleId: string,
  learnerId: string,
): Promise<{ moduleId: string; learnerId: string; reset: true }> {
  return delay({ moduleId, learnerId, reset: true as const });
}

// CONNECT: replace with real API call to GET /api/trainer/quiz-templates/:id/questions
export async function getTemplateQuestions(templateId: string): Promise<BuilderQuestion[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(mockBuilderQuestions.map((q) => ({ ...q, id: `${templateId}-${q.id}` })));
}

// CONNECT: replace with real API call to GET /api/trainer/quizzes/:id/results
export async function getQuizResults(quizId: string): Promise<QuizResultRow[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(quizResultsFor(quizId));
}

/* ============================================================
 * ADMIN repositories — users & progress, assignments, reports,
 * light customization. Deliberately small surface.
 * ============================================================ */

// CONNECT: replace with real API call to GET /api/admin/users?q=&status=&team=&department=&location=&employeeType=&function=&grade=&role=
// The advanced search (pointer 10) sends these as query params; the server owns
// the real user-attribute schema. Free text `q` matches name / user id / email.
export async function getUsers(query = "", filters: UserFilters = {}): Promise<AdminUser[]> {
  if (EMPTY_STATE) return delay([]);
  const q = (filters.q ?? query).trim().toLowerCase();
  const all = [...mockUsers, ...addedUsers];

  const matchesText = (u: AdminUser) =>
    !q ||
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.userId.toLowerCase().includes(q);

  const eq = (value: string, filter?: string) => !filter || filter === "all" || value === filter;

  return delay(
    all.filter(
      (u) =>
        matchesText(u) &&
        eq(u.userStatus, filters.status) &&
        eq(u.team, filters.team) &&
        eq(u.department, filters.department) &&
        eq(u.location, filters.location) &&
        eq(u.employeeType, filters.employeeType) &&
        eq(u.functionArea, filters.functionArea) &&
        eq(u.grade, filters.grade) &&
        eq(u.role, filters.role),
    ),
  );
}

// CONNECT: replace with real API call to GET /api/admin/users/:id
export async function getUser(id: string): Promise<AdminUser | null> {
  if (EMPTY_STATE) return delay(null);
  return delay([...mockUsers, ...addedUsers].find((u) => u.id === id) ?? null);
}

// CONNECT: replace with real API call to GET /api/admin/users/:id/progress
export async function getUserProgress(id: string): Promise<UserProgressItem[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(userProgressFor(id));
}

/** Users added by hand in this session. Normally people are auto-provisioned. */
const addedUsers: AdminUser[] = [];

// CONNECT: replace with real API call to POST /api/admin/users
// Also used per-row by the CSV import (pointer 12); the server validates the file.
export async function addUser(input: {
  name: string;
  email: string;
  team: string;
  role: AdminRole;
  department?: string | undefined;
  location?: string | undefined;
  designation?: string | undefined;
  employeeType?: AdminUser["employeeType"] | undefined;
  functionArea?: string | undefined;
  grade?: string | undefined;
  manager?: string | undefined;
}): Promise<AdminUser> {
  const user: AdminUser = {
    id: `u-new-${addedUsers.length + 1}`,
    userId: `NS-N${addedUsers.length + 1}`,
    name: input.name,
    email: input.email,
    mobileNumber: "—",
    createdOn: new Date().toISOString().slice(0, 10),
    allowedViews: ["learner"],
    userStatus: "invited",
    team: input.team,
    department: input.department ?? "Research",
    location: input.location ?? "Noida",
    role: input.role,
    designation: input.designation ?? "Analyst",
    employeeType: input.employeeType ?? "full-time",
    functionArea: input.functionArea ?? functionForDivision(input.team),
    grade: input.grade ?? "G1",
    manager: input.manager ?? "—",
    joiningDate: new Date().toISOString().slice(0, 10),
    assignedCount: 0,
    completeCount: 0,
    lastActive: "Never",
    provisioned: "manual",
  };
  addedUsers.push(user);
  return delay(user);
}

// CONNECT: replace with real API call to PUT /api/admin/users/:id
export async function updateUser(
  id: string,
  updates: Partial<AdminUser>,
): Promise<AdminUser | null> {
  const current = [...mockUsers, ...addedUsers].find((user) => user.id === id);
  return delay(current ? { ...current, ...updates, id } : null);
}

// CONNECT: replace with real API call to GET /api/admin/modules
export async function getAssignableModules(): Promise<AssignableModule[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(mockAssignableModules);
}

// CONNECT: replace with real API call to GET /api/admin/modules/:id/assignments
export async function getModuleAssignments(moduleId: string): Promise<ModuleAssignment[]> {
  if (EMPTY_STATE) return delay([]);
  const stored = assignmentStore.get(moduleId);
  if (stored) return delay(stored);
  return delay(assignmentsFor(moduleId));
}

/** In-session assignment edits, so the admin screen feels live before an API exists. */
const assignmentStore = new Map<string, ModuleAssignment[]>();

// CONNECT: replace with real API call to PUT /api/admin/modules/:id/assignments
export async function updateAssignment(
  moduleId: string,
  change:
    | { op: "add"; assignment: ModuleAssignment }
    | { op: "remove"; assignmentIds: string[] }
    | { op: "due-date"; assignmentIds: string[]; dueDate: string },
): Promise<ModuleAssignment[]> {
  const current = assignmentStore.get(moduleId) ?? assignmentsFor(moduleId);
  let next = current;
  if (change.op === "add") next = [change.assignment, ...current];
  if (change.op === "remove") next = current.filter((a) => !change.assignmentIds.includes(a.id));
  if (change.op === "due-date")
    next = current.map((a) =>
      change.assignmentIds.includes(a.id) ? { ...a, dueDate: change.dueDate } : a,
    );
  assignmentStore.set(moduleId, next);
  return delay(next);
}

// CONNECT: replace with real API call to GET /api/admin/reports
export async function getReports(): Promise<ReportSummary[]> {
  if (EMPTY_STATE) return delay([]);
  return delay(mockReports);
}

// CONNECT: replace with real API call to GET /api/admin/reports/:id?tab=&period=&department=&location=&team=&program=
export async function getReport(
  id: ReportId,
  filters?: ReportFilters,
): Promise<ReportDetail | null> {
  if (EMPTY_STATE) return delay(null);
  const detail = reportDetail(id, filters?.tab ?? "dashboard");
  if (!detail) return delay(null);
  const noFilters =
    !filters ||
    ((filters.department === "all" || !filters.department) &&
      (filters.location === "all" || !filters.location) &&
      (!filters.team || filters.team === "all") &&
      (!filters.program || filters.program === "all"));
  if (noFilters) return delay(detail);
  // Mocked filtering: narrow the row set so filters visibly do something.
  // The dashboard KPIs/charts stay (they are org-wide summaries).
  const rows = detail.rows.filter((_, i) => i % 2 === 0);
  return delay({ ...detail, rows });
}

// CONNECT: replace with real API call to POST /api/admin/reports/custom
// The server owns the query/report engine; this returns a filtered view of the
// base report so the builder can preview a result.
export async function generateCustomReport(spec: CustomReportSpec): Promise<ReportDetail | null> {
  if (EMPTY_STATE) return delay(null);
  const detail = reportDetail(spec.base, "by-learner");
  if (!detail) return delay(null);
  const keyword = spec.keyword.trim().toLowerCase();
  const columns =
    spec.fields.length > 0
      ? detail.columns.filter((c) => spec.fields.includes(c.key))
      : detail.columns;
  const rows = keyword
    ? detail.rows.filter((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(keyword)),
      )
    : detail.rows;
  const result: ReportDetail = {
    id: detail.id,
    name: `Custom — ${detail.name}`,
    description: `Generated view${keyword ? ` matching "${spec.keyword}"` : ""}, grouped by ${spec.groupBy}.`,
    tab: detail.tab,
    columns: columns.length > 0 ? columns : detail.columns,
    rows,
  };
  return delay(result);
}

// CONNECT: replace with real API call to GET /api/admin/settings
export async function getPlatformSettings(): Promise<PlatformSettings> {
  return delay(settingsStore ?? mockPlatformSettings);
}

let settingsStore: PlatformSettings | null = null;

// CONNECT: replace with real API call to PUT /api/admin/settings
export async function savePlatformSettings(settings: PlatformSettings): Promise<PlatformSettings> {
  settingsStore = settings;
  return delay(settings);
}

/* ------------------------------------------------------------
 * Config surfaces — thin controls over backend engines.
 * Delivery, the enrollment engine, and the points engine are
 * backend-owned; these persist the admin's configuration only.
 * ------------------------------------------------------------ */

let notificationStore: NotificationSetting[] | null = null;
let enrollmentStore: EnrollmentRule[] | null = null;
let pointsStore: PointsRule[] | null = null;

// CONNECT: replace with real API call to GET /api/admin/notification-settings
export async function getNotificationSettings(): Promise<NotificationSetting[]> {
  return delay(notificationStore ?? mockNotificationSettings);
}

// CONNECT: replace with real API call to PUT /api/admin/notification-settings
export async function saveNotificationSettings(
  settings: NotificationSetting[],
): Promise<NotificationSetting[]> {
  notificationStore = settings;
  return delay(settings);
}

// CONNECT: replace with real API call to GET /api/admin/enrollment-rules
export async function getEnrollmentRules(): Promise<EnrollmentRule[]> {
  return delay(enrollmentStore ?? mockEnrollmentRules);
}

// CONNECT: replace with real API call to PUT /api/admin/enrollment-rules
export async function saveEnrollmentRules(rules: EnrollmentRule[]): Promise<EnrollmentRule[]> {
  enrollmentStore = rules;
  return delay(rules);
}

// CONNECT: replace with real API call to GET /api/admin/points-rules
export async function getPointsRules(): Promise<PointsRule[]> {
  return delay(pointsStore ?? mockPointsRules);
}

// CONNECT: replace with real API call to PUT /api/admin/points-rules
export async function savePointsRules(rules: PointsRule[]): Promise<PointsRule[]> {
  pointsStore = rules;
  return delay(rules);
}

/* ============================================================
 * MANDATORY QUIZ COMPLIANCE
 * ============================================================ */

/** In-session mandatory flags + reminder ticks, until the API lands. */
const mandatoryFlagStore = new Map<string, boolean>();
const remindedStore = new Map<string, Map<string, string>>();

// CONNECT: replace with real API call to GET /api/admin/mandatory-quizzes
export async function getMandatoryQuizzes(): Promise<MandatoryQuiz[]> {
  if (EMPTY_STATE) return delay([]);
  const list = mockMandatoryQuizzes.filter((q) => mandatoryFlagStore.get(q.quizId) !== false);
  return delay(list);
}

// CONNECT: replace with real API call to GET /api/quizzes/:id/completion
export async function getQuizCompletion(quizId: string): Promise<QuizCompletionRow[]> {
  if (EMPTY_STATE) return delay([]);
  const reminded = remindedStore.get(quizId);
  const rows = completionFor(quizId).map((r) =>
    reminded?.has(r.learnerId) ? { ...r, lastRemindedOn: reminded.get(r.learnerId)! } : r,
  );
  return delay(rows);
}

// CONNECT: replace with real API call to PUT /api/quizzes/:id/mandatory
export async function setQuizMandatory(
  quizId: string,
  mandatory: boolean,
): Promise<{ quizId: string; mandatory: boolean }> {
  mandatoryFlagStore.set(quizId, mandatory);
  return delay({ quizId, mandatory });
}

// CONNECT: replace with real API call to POST /api/quizzes/:id/reminders
export async function sendQuizReminder(
  quizId: string,
  learnerIds: string[],
): Promise<{ sent: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const map = remindedStore.get(quizId) ?? new Map<string, string>();
  learnerIds.forEach((id) => map.set(id, today));
  remindedStore.set(quizId, map);
  return delay({ sent: learnerIds.length });
}
