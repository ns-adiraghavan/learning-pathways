import type {
  AdminUser,
  AssignableModule,
  ModuleAssignment,
  PlatformSettings,
  ReportDetail,
  ReportId,
  ReportSummary,
  UserProgressItem,
} from "./types";

import { trainerModules } from "./trainer-mocks";

const NAMES = [
  "Ananya Rao",
  "Rahul Menon",
  "Priya Nair",
  "Vikram Iyer",
  "Sneha Kulkarni",
  "Arjun Desai",
  "Meera Joshi",
  "Karthik Reddy",
  "Divya Sharma",
  "Nikhil Bose",
  "Farah Sheikh",
  "Rohan Gupta",
  "Ishita Verma",
  "Sameer Khan",
  "Lakshmi Pillai",
  "Tanvi Shah",
  "Aditya Rane",
  "Neha Bansal",
  "Imran Qureshi",
  "Pooja Mehta",
  "Suresh Babu",
  "Kavya Krishnan",
  "Manish Agarwal",
  "Ritika Sen",
];

const TEAMS = ["Research Delivery", "Data Solutions", "Client Success", "People Ops", "Technology"];
export const DEPARTMENTS = ["Research", "Technology", "People Ops", "Client Success"];
export const LOCATIONS = ["Noida", "Bengaluru", "Mumbai", "Remote"];

export const users: AdminUser[] = NAMES.map((name, i): AdminUser => {
  const assigned = 4 + (i % 5);
  const complete = Math.max(0, assigned - ((i * 3) % 5));
  const role: AdminUser["role"] = i === 0 ? "Administrator" : i % 7 === 0 ? "Trainer" : "Learner";
  return {
    id: `u-${i + 1}`,
    userId: `NS-${String(10240 + i * 7)}`,
    name,
    mobileNumber: `+91 9${String(800000000 + i * 1234567).slice(0, 9)}`,
    createdOn: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
    allowedViews:
      role === "Administrator"
        ? ["learner", "trainer", "admin"]
        : role === "Trainer"
          ? ["learner", "trainer"]
          : ["learner"],
    userStatus: i % 9 === 0 ? "inactive" : i % 13 === 0 ? "invited" : "active",
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@netscribes.com`,
    team: TEAMS[i % TEAMS.length]!,
    department: DEPARTMENTS[i % DEPARTMENTS.length]!,
    location: LOCATIONS[i % LOCATIONS.length]!,
    role,
    assignedCount: assigned,
    completeCount: complete,
    lastActive: ["Today", "Yesterday", "2 days ago", "Last week", "3 weeks ago"][i % 5]!,
    provisioned: i % 11 === 0 ? "manual" : "auto",
  };
});

const MODULE_TITLES = [
  "Information Security 2026",
  "Quality Management 2026",
  "Company & Culture",
  "Research Methods: Sourcing",
  "Client Communication Basics",
  "Policies & Benefits",
  "Process Audit Readiness",
  "Data Handling Refresher",
];

export function progressFor(userId: string): UserProgressItem[] {
  const seed = Number(userId.split("-")[1] ?? 1);
  const count = 4 + (seed % 4);
  return Array.from({ length: count }, (_, i) => {
    const n = (seed + i * 3) % 10;
    const pct = n < 3 ? 0 : n < 7 ? 20 + n * 9 : 100;
    return {
      moduleId: `m-${i + 1}`,
      title: MODULE_TITLES[(seed + i) % MODULE_TITLES.length]!,
      status: pct === 0 ? "not-started" : pct === 100 ? "complete" : "in-progress",
      progressPct: pct,
      dueDate: ["12 Mar 2026", "30 Apr 2026", "18 Jun 2026", "01 Sep 2026"][i % 4]!,
    } satisfies UserProgressItem;
  });
}

export const assignableModules: AssignableModule[] = trainerModules.map((m) => ({
  id: m.id,
  title: m.title,
  programTitle: m.title.includes("Quality") || m.title.includes("Security")
    ? "ISO Training"
    : m.title.includes("Client") || m.title.includes("Research")
      ? "Research Craft"
      : "New Joiner Onboarding",
  assignedCount: m.enrolled,
}));

export function assignmentsFor(moduleId: string): ModuleAssignment[] {
  const seed = moduleId.length;
  const teams: ModuleAssignment[] = TEAMS.slice(0, 3).map((team, i) => ({
    id: `t-${moduleId}-${i}`,
    kind: "team",
    name: team,
    detail: `${DEPARTMENTS[i % DEPARTMENTS.length]} · ${LOCATIONS[i % LOCATIONS.length]}`,
    headcount: 40 + ((seed + i * 17) % 90),
    dueDate: ["30 Apr 2026", "18 Jun 2026", "01 Sep 2026"][i % 3]!,
    status: (["in-progress", "not-started", "complete"] as const)[i % 3]!,
    progressPct: [62, 8, 100][i % 3]!,
  }));

  const people: ModuleAssignment[] = users.slice(0, 8).map((u, i) => {
    const pct = [0, 35, 100, 72, 0, 100, 18, 55][i]!;
    return {
      id: `a-${moduleId}-${u.id}`,
      kind: "user",
      name: u.name,
      detail: `${u.team} · ${u.location}`,
      headcount: 1,
      dueDate: ["30 Apr 2026", "18 Jun 2026"][i % 2]!,
      status: pct === 0 ? "not-started" : pct === 100 ? "complete" : "in-progress",
      progressPct: pct,
    };
  });

  return [...teams, ...people];
}

export const reports: ReportSummary[] = [
  {
    id: "completion-ratio",
    name: "Completion Ratio",
    description: "Assigned vs completed modules, sliced by team.",
    lastRun: "Ran 2 days ago",
  },
  {
    id: "time-spent",
    name: "Time Spent",
    description: "Average and total learning hours per team.",
    lastRun: "Ran last week",
  },
  {
    id: "leaderboard-points",
    name: "Leaderboard Points",
    description: "Points earned by learners over the period.",
    lastRun: "Ran yesterday",
  },
  {
    id: "audit-log",
    name: "Audit Log",
    description: "Who changed what — assignments, publishes, settings.",
    lastRun: "Live",
  },
];

const teamRows = TEAMS.map((team, i) => {
  const assigned = [1240, 860, 540, 220, 610][i]!;
  const completed = [1012, 640, 402, 198, 431][i]!;
  return { team, assigned, completed, ratio: `${Math.round((completed / assigned) * 100)}%` };
});

const reportRows: Record<ReportId, ReportDetail> = {
  "completion-ratio": {
    id: "completion-ratio",
    name: "Completion Ratio",
    description: "Assigned vs completed modules for the selected period.",
    columns: [
      { key: "team", label: "Team" },
      { key: "assigned", label: "Assigned", numeric: true },
      { key: "completed", label: "Completed", numeric: true },
      { key: "ratio", label: "Ratio", numeric: true },
    ],
    rows: teamRows,
  },
  "time-spent": {
    id: "time-spent",
    name: "Time Spent",
    description: "Learning hours logged across the organisation.",
    columns: [
      { key: "team", label: "Team" },
      { key: "learners", label: "Learners", numeric: true },
      { key: "totalHours", label: "Total hours", numeric: true },
      { key: "avgMins", label: "Avg mins / module", numeric: true },
    ],
    rows: TEAMS.map((team, i) => ({
      team,
      learners: [148, 96, 64, 28, 74][i]!,
      totalHours: [612, 388, 244, 96, 301][i]!,
      avgMins: [34, 41, 29, 37, 32][i]!,
    })),
  },
  "leaderboard-points": {
    id: "leaderboard-points",
    name: "Leaderboard Points",
    description: "Points earned by learners in the selected period.",
    columns: [
      { key: "name", label: "Learner" },
      { key: "team", label: "Team" },
      { key: "modules", label: "Modules", numeric: true },
      { key: "points", label: "Points", numeric: true },
    ],
    rows: users.slice(0, 12).map((u, i) => ({
      name: u.name,
      team: u.team,
      modules: 12 - i,
      points: 2450 - i * 137,
    })),
  },
  "audit-log": {
    id: "audit-log",
    name: "Audit Log",
    description: "Recent administrative changes.",
    columns: [
      { key: "when", label: "When" },
      { key: "actor", label: "Actor" },
      { key: "action", label: "Action" },
      { key: "target", label: "Target" },
    ],
    rows: [
      { when: "Today 09:12", actor: "Ananya Rao", action: "Published module", target: "Quality Management 2026" },
      { when: "Today 08:40", actor: "Rahul Menon", action: "Changed due date", target: "Information Security 2026" },
      { when: "Yesterday 17:05", actor: "Priya Nair", action: "Assigned team", target: "Client Success → Onboarding" },
      { when: "Yesterday 11:22", actor: "System", action: "Auto-provisioned user", target: "ritika.sen@netscribes.com" },
      { when: "2 days ago", actor: "Ananya Rao", action: "Updated default certificate", target: "Netscribes Classic" },
      { when: "3 days ago", actor: "Vikram Iyer", action: "Unenrolled 12 learners", target: "Research Methods: Sourcing" },
    ],
  },
};

export function reportDetail(id: ReportId): ReportDetail | null {
  return reportRows[id] ?? null;
}

export const platformSettings: PlatformSettings = {
  terminology: {
    moduleLabel: "Module",
    programLabel: "Program",
    skillLabel: "Skill",
    learnerLabel: "Learner",
  },
  banners: [
    { id: "b-1", title: "ISO audit window opens 12 March", audience: "All employees", active: true },
    { id: "b-2", title: "New joiner orientation every Monday", audience: "New joiners", active: true },
    { id: "b-3", title: "Year-end certificates available", audience: "All employees", active: false },
  ],
  notifications: [
    { id: "n-assign", label: "New assignment", enabled: true },
    { id: "n-due", label: "Due date reminder", enabled: true },
    { id: "n-overdue", label: "Overdue nudge", enabled: true },
    { id: "n-complete", label: "Completion & certificate", enabled: true },
    { id: "n-digest", label: "Weekly digest", enabled: false },
  ],
  defaultCertificateTemplateId: "ct-classic",
};
