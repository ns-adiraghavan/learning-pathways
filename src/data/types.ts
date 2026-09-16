/**
 * Lessons — domain types.
 * These shapes mirror what the real backend is expected to return.
 */

export type ModuleCategory = "onboarding" | "mandatory" | "team" | "bank";

export type ModuleStatus = "not-started" | "in-progress" | "complete" | "overdue";

export type Difficulty = "easy" | "medium" | "hard";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "learner" | "trainer" | "admin";
  team: string;
  avatarUrl?: string;
}

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  difficulty: Difficulty;
  options: QuizOption[];
  correctOptionId: string;
}

export interface VideoActivity {
  id: string;
  name: string;
  type: "video";
  src: string;
  durationMins: number;
  required: boolean;
  enforceFocus: boolean;
}

export interface DeckActivity {
  id: string;
  name: string;
  type: "deck";
  src: string;
  pages: number;
  required: boolean;
}

export interface WeblinkActivity {
  id: string;
  name: string;
  type: "weblink";
  url: string;
  required: boolean;
}

export interface QuizActivity {
  id: string;
  name: string;
  type: "quiz";
  templateId: string;
  questions: QuizQuestion[];
  /** Needed to finish the module. */
  required: boolean;
  /** Compliance-tracked across the org (distinct from `required`). */
  mandatory: boolean;
  timeLimitMins: number;
  shuffle: boolean;
}

export type Activity = VideoActivity | DeckActivity | WeblinkActivity | QuizActivity;

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  posterImage: string;
  category: ModuleCategory;
  dueDate: string; // ISO date
  status: ModuleStatus;
  progressPct: number;
  orderLocked: boolean;
  activities: Activity[];
}

export interface ModuleProgress {
  moduleId: string;
  progressPct: number;
  status: ModuleStatus;
  completedActivityIds: string[];
}

export interface DifficultyBreakup {
  difficulty: Difficulty;
  total: number;
  right: number;
  wrong: number;
  unanswered: number;
}

export interface QuizResult {
  quizId: string;
  scorePct: number;
  passed: boolean;
  passMarkPct: number;
  totalQuestions: number;
  breakup: DifficultyBreakup[];
}

export type PendingActionKind = "survey" | "esignature";

export interface PendingAction {
  id: string;
  kind: PendingActionKind;
  title: string;
  dueDate: string;
  moduleId?: string;
}

export interface Certificate {
  id: string;
  moduleId: string;
  title: string;
  issuedOn: string;
  credentialId: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  team: string;
  modulesComplete: number;
  points: number;
  isCurrentUser: boolean;
}

export interface ProgressSummary {
  totalModules: number;
  completedModules: number;
  mandatoryTotal: number;
  mandatoryComplete: number;
  optionalTotal: number;
  optionalComplete: number;
  overdueCount: number;
  inProgressCount: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

/* ============================================================
 * TRAINER domain
 * Content is organised Program → Skill → Module.
 * ============================================================ */

export type ActivityType = Activity["type"];

export type PublishState = "draft" | "published";

export interface Program {
  id: string;
  title: string;
  description: string;
  owner: string;
  skillCount: number;
  moduleCount: number;
  learnerCount: number;
  state: PublishState;
}

export interface Skill {
  id: string;
  programId: string;
  programTitle: string;
  title: string;
  description: string;
  moduleCount: number;
  learnerCount: number;
}

/** A module as the trainer sees it inside a skill. */
export interface TrainerModuleSummary {
  id: string;
  skillId: string;
  title: string;
  year: number;
  state: PublishState;
  activityCount: number;
  enrolled: number;
  completionPct: number;
  updatedOn: string;
}

export interface DraftActivity {
  id: string;
  name: string;
  type: ActivityType;
  meta: string;
  required: boolean;
  draft: boolean;
  /** Quiz only: compliance-tracked across the org. */
  mandatory: boolean;
}

export type PushEnrollment = "all-skill" | "audience" | "manual";
export type SelfEnrollment = "block" | "any" | "criteria";
export type DueMode = "fixed" | "relative";

export interface ModuleSettings {
  pushEnrollment: PushEnrollment;
  targetAudience: string;
  selfEnrollment: SelfEnrollment;
  criteria: string;
  dueMode: DueMode;
  dueDate: string;
  dueWithinDays: number;
  esignature: boolean;
  tags: string[];
  keywords: string[];
  leaderboardPoints: number;
}

export interface ModuleDraft {
  id: string;
  skillId: string;
  skillTitle: string;
  programTitle: string;
  title: string;
  description: string;
  posterImage: string;
  state: PublishState;
  orderLocked: boolean;
  certificateTemplateId: string | null;
  feedbackSurveyId: string | null;
  activities: DraftActivity[];
  settings: ModuleSettings;
}

export type EnrolledStatus = "not-started" | "in-progress" | "complete";

export interface EnrolledLearner {
  id: string;
  name: string;
  email: string;
  team: string;
  status: EnrolledStatus;
  progressPct: number;
  dueDate: string;
  lastActivity: string;
}

export interface ModuleAnalytics {
  enrolled: number;
  completionPct: number;
  passRatePct: number;
  avgTimeMins: number;
  notStarted: number;
  inProgress: number;
  complete: number;
}

export interface QuizTemplate {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  timeLimitMins: number;
  mix: Record<Difficulty, number>;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  orientation: "landscape" | "portrait";
  accent: string;
}

export interface FeedbackSurvey {
  id: string;
  name: string;
  questionCount: number;
}

export interface BuilderQuestion {
  id: string;
  prompt: string;
  difficulty: Difficulty;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizSettings {
  shuffle: boolean;
  passingPct: number;
  maxReattempts: number;
  timeLimitMins: number;
}

export interface QuizResultRow {
  learnerId: string;
  name: string;
  team: string;
  scorePct: number;
  passed: boolean;
  timeTakenMins: number;
  attempts: number;
  outlier: boolean;
}

/* ============================================================
 * ADMIN domain — four jobs only:
 * users & progress, assignments, reports, light customization.
 * ============================================================ */

export type AdminRole = "Learner" | "Trainer" | "Administrator";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  team: string;
  department: string;
  location: string;
  role: AdminRole;
  assignedCount: number;
  completeCount: number;
  lastActive: string;
  provisioned: "auto" | "manual";
}

export interface UserProgressItem {
  moduleId: string;
  title: string;
  status: EnrolledStatus;
  progressPct: number;
  dueDate: string;
}

export type AssigneeKind = "user" | "team";

export interface ModuleAssignment {
  id: string;
  kind: AssigneeKind;
  name: string;
  detail: string;
  headcount: number;
  dueDate: string;
  status: EnrolledStatus;
  progressPct: number;
}

export interface AssignableModule {
  id: string;
  title: string;
  programTitle: string;
  assignedCount: number;
}

export type ReportId = "completion-ratio" | "time-spent" | "leaderboard-points" | "audit-log";

export interface ReportSummary {
  id: ReportId;
  name: string;
  description: string;
  lastRun: string;
}

export interface ReportDetail {
  id: ReportId;
  name: string;
  description: string;
  columns: { key: string; label: string; numeric?: boolean }[];
  rows: Record<string, string | number>[];
}

export interface ReportFilters {
  period: "30d" | "90d" | "year" | "all";
  department: string;
  location: string;
}

export interface PlatformBanner {
  id: string;
  title: string;
  audience: string;
  active: boolean;
}

export interface PlatformSettings {
  terminology: { moduleLabel: string; programLabel: string; skillLabel: string; learnerLabel: string };
  banners: PlatformBanner[];
  notifications: { id: string; label: string; enabled: boolean }[];
  defaultCertificateTemplateId: string | null;
}
