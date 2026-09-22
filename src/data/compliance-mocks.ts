/**
 * Mandatory quiz compliance — demo records only.
 * Shapes mirror MandatoryQuiz / QuizCompletionRow in types.ts.
 */

import type { MandatoryQuiz, QuizCompletionRow } from "./types";
import { users } from "./admin-mocks";

export const mandatoryQuizzes: MandatoryQuiz[] = [
  {
    id: "mq-1",
    quizId: "a-welcome-4",
    moduleId: "m-welcome",
    moduleTitle: "Welcome to Netscribes",
    programTitle: "New Joiner Onboarding",
    skillTitle: "Company Basics",
    quizName: "Know your workplace quiz",
    enrolled: 24,
    completed: 17,
    notCompleted: 7,
    completionPct: 71,
    dueDate: "2026-10-15",
    passMarkPct: 70,
  },
  {
    id: "mq-2",
    quizId: "a-infosec-4",
    moduleId: "m-infosec",
    moduleTitle: "Information Security 2026",
    programTitle: "ISO Training",
    skillTitle: "Information Security",
    quizName: "ISO 27001 assessment",
    enrolled: 24,
    completed: 11,
    notCompleted: 13,
    completionPct: 46,
    dueDate: "2026-09-30",
    passMarkPct: 80,
  },
  {
    id: "mq-3",
    quizId: "a-posh-4",
    moduleId: "m-posh",
    moduleTitle: "Prevention of Sexual Harassment",
    programTitle: "ISO Training",
    skillTitle: "Quality Management",
    quizName: "POSH policy check",
    enrolled: 24,
    completed: 22,
    notCompleted: 2,
    completionPct: 92,
    dueDate: "2026-12-31",
    passMarkPct: 60,
  },
  {
    id: "mq-4",
    quizId: "a-research-4",
    moduleId: "m-research",
    moduleTitle: "Research Methods Refresher",
    programTitle: "Research Craft",
    skillTitle: "Delivery Quality",
    quizName: "Sourcing discipline quiz",
    enrolled: 18,
    completed: 6,
    notCompleted: 12,
    completionPct: 33,
    dueDate: "2026-11-20",
    passMarkPct: 75,
  },
];

const COMPLETED_ON = ["2026-08-04", "2026-08-19", "2026-09-01", "2026-09-08", "2026-09-12"];

/** Deterministic per-quiz completion rows so the demo stays stable between renders. */
export function completionFor(quizId: string): QuizCompletionRow[] {
  const quiz = mandatoryQuizzes.find((q) => q.quizId === quizId);
  const seed = quizId.length;
  const people = users.slice(0, quiz?.enrolled ?? 20);

  return people.map((u, i) => {
    const completed = (i * 7 + seed) % 10 < 7;
    return {
      learnerId: u.id,
      name: u.name,
      email: u.email,
      team: u.team,
      status: completed ? "completed" : "not-completed",
      completedOn: completed ? COMPLETED_ON[(i + seed) % COMPLETED_ON.length]! : null,
      scorePct: completed ? 62 + ((i * 13 + seed) % 38) : null,
      attempts: completed ? 1 + ((i + seed) % 3) : 0,
      lastRemindedOn: !completed && i % 5 === 0 ? "2026-09-10" : null,
    };
  });
}
