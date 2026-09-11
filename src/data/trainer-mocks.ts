import posterOnboarding from "@/assets/poster-onboarding.jpg";
import posterMandatory from "@/assets/poster-mandatory.jpg";
import posterTeam from "@/assets/poster-team.jpg";

import type {
  BuilderQuestion,
  CertificateTemplate,
  EnrolledLearner,
  FeedbackSurvey,
  ModuleDraft,
  Program,
  QuizResultRow,
  QuizTemplate,
  Skill,
  TrainerModuleSummary,
} from "./types";

export const programs: Program[] = [
  {
    id: "p-iso",
    title: "ISO Training",
    description:
      "Annual certification curriculum covering quality, information security and process audit readiness.",
    owner: "Rahul Menon",
    skillCount: 2,
    moduleCount: 4,
    learnerCount: 512,
    state: "published",
  },
  {
    id: "p-onboarding",
    title: "New Joiner Onboarding",
    description:
      "Everything a new Netscribian needs in their first 30 days — company, tools, policies and team rituals.",
    owner: "Priya Nair",
    skillCount: 2,
    moduleCount: 3,
    learnerCount: 186,
    state: "published",
  },
  {
    id: "p-research",
    title: "Research Craft",
    description:
      "Core delivery skills for analysts: methods, sourcing discipline, client communication and review quality.",
    owner: "Ananya Rao",
    skillCount: 2,
    moduleCount: 3,
    learnerCount: 274,
    state: "draft",
  },
];

export const skills: Skill[] = [
  {
    id: "s-quality",
    programId: "p-iso",
    programTitle: "ISO Training",
    title: "Quality Management",
    description: "ISO 9001 principles, process controls and internal audit basics.",
    moduleCount: 2,
    learnerCount: 512,
  },
  {
    id: "s-infosec",
    programId: "p-iso",
    programTitle: "ISO Training",
    title: "Information Security",
    description: "ISO 27001 controls, data handling and incident reporting.",
    moduleCount: 2,
    learnerCount: 498,
  },
  {
    id: "s-company",
    programId: "p-onboarding",
    programTitle: "New Joiner Onboarding",
    title: "Company & Culture",
    description: "Who we are, how we work and the rituals that keep delivery moving.",
    moduleCount: 2,
    learnerCount: 186,
  },
  {
    id: "s-policies",
    programId: "p-onboarding",
    programTitle: "New Joiner Onboarding",
    title: "Policies & Benefits",
    description: "Leave, payroll, code of conduct and the people policies that matter early.",
    moduleCount: 1,
    learnerCount: 186,
  },
  {
    id: "s-methods",
    programId: "p-research",
    programTitle: "Research Craft",
    title: "Research Methods",
    description: "Primary vs secondary design, sampling and sourcing discipline.",
    moduleCount: 2,
    learnerCount: 274,
  },
  {
    id: "s-client",
    programId: "p-research",
    programTitle: "Research Craft",
    title: "Client Communication",
    description: "Writing for clients, review etiquette and difficult conversations.",
    moduleCount: 1,
    learnerCount: 152,
  },
];

export const trainerModules: TrainerModuleSummary[] = [
  {
    id: "d-quality-2026",
    skillId: "s-quality",
    title: "Quality Management 2026",
    year: 2026,
    state: "published",
    activityCount: 4,
    enrolled: 512,
    completionPct: 61,
    updatedOn: "2026-08-28",
  },
  {
    id: "d-quality-2025",
    skillId: "s-quality",
    title: "Quality Management 2025",
    year: 2025,
    state: "published",
    activityCount: 3,
    enrolled: 486,
    completionPct: 97,
    updatedOn: "2025-09-02",
  },
  {
    id: "d-infosec-2026",
    skillId: "s-infosec",
    title: "Information Security 2026",
    year: 2026,
    state: "published",
    activityCount: 4,
    enrolled: 498,
    completionPct: 44,
    updatedOn: "2026-09-01",
  },
  {
    id: "d-infosec-2025",
    skillId: "s-infosec",
    title: "Information Security 2025",
    year: 2025,
    state: "published",
    activityCount: 3,
    enrolled: 470,
    completionPct: 99,
    updatedOn: "2025-08-19",
  },
  {
    id: "d-company-2026",
    skillId: "s-company",
    title: "Welcome to Netscribes",
    year: 2026,
    state: "published",
    activityCount: 3,
    enrolled: 186,
    completionPct: 72,
    updatedOn: "2026-07-14",
  },
  {
    id: "d-culture-2026",
    skillId: "s-company",
    title: "How We Work Together",
    year: 2026,
    state: "draft",
    activityCount: 2,
    enrolled: 0,
    completionPct: 0,
    updatedOn: "2026-09-05",
  },
  {
    id: "d-policies-2026",
    skillId: "s-policies",
    title: "Benefits, Leave & Payroll",
    year: 2026,
    state: "published",
    activityCount: 3,
    enrolled: 186,
    completionPct: 58,
    updatedOn: "2026-06-30",
  },
  {
    id: "d-methods-2026",
    skillId: "s-methods",
    title: "Research Methods for Analysts",
    year: 2026,
    state: "published",
    activityCount: 4,
    enrolled: 274,
    completionPct: 39,
    updatedOn: "2026-08-11",
  },
  {
    id: "d-sourcing-2026",
    skillId: "s-methods",
    title: "Sourcing & Citation Discipline",
    year: 2026,
    state: "draft",
    activityCount: 2,
    enrolled: 0,
    completionPct: 0,
    updatedOn: "2026-09-08",
  },
  {
    id: "d-client-2026",
    skillId: "s-client",
    title: "Client Communication Craft",
    year: 2026,
    state: "published",
    activityCount: 3,
    enrolled: 152,
    completionPct: 51,
    updatedOn: "2026-08-02",
  },
];

const POSTER_BY_SKILL: Record<string, string> = {
  "s-quality": posterMandatory,
  "s-infosec": posterMandatory,
  "s-company": posterOnboarding,
  "s-policies": posterOnboarding,
  "s-methods": posterTeam,
  "s-client": posterTeam,
};

export function draftFor(summary: TrainerModuleSummary): ModuleDraft {
  const skill = skills.find((s) => s.id === summary.skillId);
  return {
    id: summary.id,
    skillId: summary.skillId,
    skillTitle: skill?.title ?? "—",
    programTitle: skill?.programTitle ?? "—",
    title: summary.title,
    description:
      "Refreshed for this cycle. Covers the standard's intent, the controls that apply to delivery teams, and what auditors ask for in practice.",
    posterImage: POSTER_BY_SKILL[summary.skillId] ?? posterMandatory,
    state: summary.state,
    orderLocked: true,
    certificateTemplateId: "ct-classic",
    feedbackSurveyId: "fs-standard",
    activities: [
      {
        id: `${summary.id}-a1`,
        name: "Standard overview",
        type: "video",
        meta: "12 min",
        required: true,
        draft: false,
      },
      {
        id: `${summary.id}-a2`,
        name: "Controls handbook",
        type: "deck",
        meta: "18 pages",
        required: true,
        draft: false,
      },
      {
        id: `${summary.id}-a3`,
        name: "Reference portal",
        type: "weblink",
        meta: "External link",
        required: false,
        draft: false,
      },
      {
        id: `${summary.id}-a4`,
        name: "Assessment",
        type: "quiz",
        meta: "10 questions · 15 min",
        required: true,
        draft: summary.state === "draft",
      },
    ].slice(0, Math.max(2, summary.activityCount)),
    settings: {
      pushEnrollment: "all-skill",
      targetAudience: "All delivery teams",
      selfEnrollment: "criteria",
      criteria: "Confirmed employees with 30+ days tenure",
      dueMode: summary.year >= 2026 ? "fixed" : "relative",
      dueDate: "2026-12-31",
      dueWithinDays: 30,
      esignature: true,
      tags: ["iso", "annual", "compliance"],
      keywords: ["audit", "standard", "controls"],
      leaderboardPoints: 50,
    },
  };
}

const FIRST = [
  "Ananya",
  "Rahul",
  "Priya",
  "Vikram",
  "Sneha",
  "Arjun",
  "Meera",
  "Karthik",
  "Divya",
  "Rohit",
  "Nisha",
  "Sameer",
];
const LAST = ["Rao", "Menon", "Nair", "Sharma", "Iyer", "Bose", "Patel", "Reddy"];
const TEAMS = ["Market Intelligence", "Data Solutions", "Client Success", "Technology"];

export function learnersFor(moduleId: string): EnrolledLearner[] {
  const total = 48;
  return Array.from({ length: total }, (_, i) => {
    const name = `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`;
    const bucket = i % 5;
    const status = bucket < 2 ? "not-started" : bucket < 4 ? "in-progress" : "complete";
    const progressPct = status === "complete" ? 100 : status === "in-progress" ? 25 + ((i * 7) % 60) : 0;
    return {
      id: `${moduleId}-l${i}`,
      name,
      email: `${name.toLowerCase().replace(" ", ".")}@netscribes.com`,
      team: TEAMS[i % TEAMS.length]!,
      status: status as EnrolledLearner["status"],
      progressPct,
      dueDate: "2026-12-31",
      lastActivity: status === "not-started" ? "—" : `${1 + (i % 14)} days ago`,
    };
  });
}

export const quizTemplates: QuizTemplate[] = [
  {
    id: "qt-iso-annual",
    name: "ISO Annual Assessment",
    description: "Standard 10-question compliance check used across ISO modules.",
    questionCount: 10,
    timeLimitMins: 15,
    mix: { easy: 4, medium: 4, hard: 2 },
  },
  {
    id: "qt-onboarding",
    name: "Onboarding Knowledge Check",
    description: "Light 6-question check for first-week modules.",
    questionCount: 6,
    timeLimitMins: 10,
    mix: { easy: 4, medium: 2, hard: 0 },
  },
  {
    id: "qt-methods",
    name: "Research Methods Assessment",
    description: "Scenario-led questions on study design and sourcing.",
    questionCount: 12,
    timeLimitMins: 20,
    mix: { easy: 3, medium: 6, hard: 3 },
  },
];

export const certificateTemplates: CertificateTemplate[] = [
  {
    id: "ct-classic",
    name: "Netscribes Classic",
    description: "Landscape certificate with the corporate mark and signature block.",
    orientation: "landscape",
    accent: "var(--primary)",
  },
  {
    id: "ct-compliance",
    name: "Compliance Record",
    description: "Portrait certificate carrying the credential ID and audit year.",
    orientation: "portrait",
    accent: "var(--status-mandatory)",
  },
  {
    id: "ct-skill",
    name: "Skill Badge",
    description: "Compact landscape certificate for skill-level completions.",
    orientation: "landscape",
    accent: "var(--status-category)",
  },
];

export const feedbackSurveys: FeedbackSurvey[] = [
  { id: "fs-standard", name: "Standard module feedback", questionCount: 5 },
  { id: "fs-onboarding", name: "Onboarding experience survey", questionCount: 8 },
];

export const builderQuestions: BuilderQuestion[] = [
  {
    id: "bq-1",
    prompt: "Which document defines how a nonconformity is recorded and closed?",
    difficulty: "easy",
    options: ["Corrective action procedure", "Client SOW", "Team charter", "Release note"],
    correctIndex: 0,
    explanation: "Nonconformities follow the corrective action procedure end to end.",
  },
  {
    id: "bq-2",
    prompt: "An auditor asks for evidence of management review. What do you provide?",
    difficulty: "medium",
    options: ["Meeting minutes and actions", "A verbal summary", "The org chart", "Client emails"],
    correctIndex: 0,
    explanation: "Signed minutes with actions and owners are the accepted evidence.",
  },
  {
    id: "bq-3",
    prompt: "A vendor requests client data over personal email. The correct response is:",
    difficulty: "hard",
    options: [
      "Refuse and raise a security incident",
      "Send it password-protected",
      "Ask a manager to send it",
      "Share a read-only link",
    ],
    correctIndex: 0,
    explanation: "Any off-channel data request is an incident, regardless of intent.",
  },
];

export function quizResultsFor(quizId: string): QuizResultRow[] {
  return Array.from({ length: 14 }, (_, i) => {
    const name = `${FIRST[(i + 3) % FIRST.length]} ${LAST[(i + 5) % LAST.length]}`;
    const scorePct = [92, 78, 64, 100, 55, 88, 71, 96, 42, 83, 67, 90, 74, 58][i]!;
    const timeTakenMins = [12, 14, 11, 2, 15, 13, 9, 3, 16, 12, 10, 14, 13, 15][i]!;
    return {
      learnerId: `${quizId}-r${i}`,
      name,
      team: TEAMS[i % TEAMS.length]!,
      scorePct,
      passed: scorePct >= 70,
      timeTakenMins,
      attempts: 1 + (i % 3),
      outlier: timeTakenMins <= 3,
    };
  });
}
