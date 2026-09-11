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

// CONNECT: replace with real API call to GET /api/modules/:id
export async function getModule(id: string): Promise<LearningModule | null> {
  if (EMPTY_STATE) return delay(null);
  return delay(mockModules.find((m) => m.id === id) ?? null);
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
  const passMarkPct = 70;

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
