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
  required: boolean;
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
