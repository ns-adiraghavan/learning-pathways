import type {
  AdminUser,
  AssignableModule,
  EnrollmentRule,
  ModuleAssignment,
  NotificationSetting,
  PlatformSettings,
  PointsRule,
  ReportChart,
  ReportColumn,
  ReportDetail,
  ReportId,
  ReportKpi,
  ReportSummary,
  ReportTab,
  UserProgressItem,
} from "./types";

import { skills as trainerSkills, trainerModules } from "./trainer-mocks";
import {
  DIVISIONS,
  ENTITIES,
  FUNCTIONS as ORG_FUNCTIONS,
  PROJECTS as ORG_PROJECTS,
  functionForDivision,
} from "./org";
import type { ModuleCompletionDetail, ModuleCompletionRow, OrgEntity } from "./types";

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
  "Nikhil",
  "Farah",
  "Rohan",
  "Ishita",
  "Sameer",
  "Lakshmi",
  "Tanvi",
  "Aditya",
  "Neha",
  "Imran",
  "Pooja",
  "Suresh",
  "Kavya",
  "Manish",
  "Ritika",
];
const LAST = ["Rao", "Menon", "Iyer", "Sharma", "Khan", "Nair"];

// ~120 people so the directory, rollup and reports feel like a real org.
const NAMES = Array.from(
  { length: 120 },
  (_, i) => `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]}`,
);

// Divisions ARE the teams (18 of them). Each rolls up to a Function — see org.ts.
export const TEAMS = [...DIVISIONS];
export const DEPARTMENTS = [
  "Delivery",
  "Technology",
  "Sales & Marketing",
  "Corporate",
  "Operations",
];
export const LOCATIONS = ["Noida", "Bengaluru", "Mumbai", "Remote"];
export const DESIGNATIONS = [
  "Analyst",
  "Senior Analyst",
  "Team Lead",
  "Manager",
  "Associate Director",
];
// The three Functions divisions roll up to (Sales / Operations / Support).
export const FUNCTIONS = [...ORG_FUNCTIONS];
export const GRADES = ["G1", "G2", "G3", "G4", "G5"];
export const EMPLOYEE_TYPES: AdminUser["employeeType"][] = ["full-time", "contract", "intern"];
export const MANAGERS = ["Ananya Rao", "Vikram Iyer", "Farah Sheikh", "Suresh Babu"];
export const ENTITIES_LIST = [...ENTITIES];
export const PROJECTS = [...ORG_PROJECTS];

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
    designation: DESIGNATIONS[i % DESIGNATIONS.length]!,
    employeeType: EMPLOYEE_TYPES[i % EMPLOYEE_TYPES.length]!,
    // Function is derived from the division, never assigned independently.
    functionArea: functionForDivision(TEAMS[i % TEAMS.length]!),
    grade: GRADES[i % GRADES.length]!,
    manager: i === 0 ? "—" : MANAGERS[i % MANAGERS.length]!,
    // ~1 in 4 people sit under NAPL; the rest under NDIPL. NAPL shares the same
    // structure but is tracked separately so compliance can be sliced per entity.
    entity: (i % 4 === 2 ? "NAPL" : "NDIPL") as OrgEntity,
    projectName: PROJECTS[i % PROJECTS.length]!,
    // Most people joined in past years; a handful are recent joiners so the
    // "New joiner" badge only shows when it actually applies.
    joiningDate:
      i % 8 === 3
        ? `2026-0${(i % 3) + 7}-${String((i % 27) + 1).padStart(2, "0")}`
        : `202${(i % 4) + 1}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
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
  programTitle:
    m.title.includes("Quality") || m.title.includes("Security")
      ? "ISO Training"
      : m.title.includes("Client") || m.title.includes("Research")
        ? "Research Craft"
        : "New Joiner Onboarding",
  skillTitle: trainerSkills.find((s) => s.id === m.skillId)?.title ?? "General",
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
    name: "Completion Ratio Report",
    description: "Assigned vs completed modules, sliced by team, program and learner.",
    lastRun: "Ran 2 days ago",
  },
  {
    id: "time-spent",
    name: "Time Spent Analytics",
    description: "Average and total learning hours across the organisation.",
    lastRun: "Ran last week",
  },
  {
    id: "leaderboard-points",
    name: "Leaderboard Points Report",
    description: "Points earned by learners over the period.",
    lastRun: "Ran yesterday",
  },
  {
    id: "login",
    name: "Login Reports",
    description: "Sign-in frequency and active users over the period.",
    lastRun: "Ran today",
  },
  {
    id: "audit-log",
    name: "Audit Logs",
    description: "Who changed what — assignments, publishes, settings.",
    lastRun: "Live",
  },
];

export const PROGRAMS = [
  "ISO Training",
  "Research Craft",
  "New Joiner Onboarding",
  "Leadership Track",
];

export const REPORT_TABS: { value: ReportTab; label: string }[] = [
  { value: "dashboard", label: "Dashboard" },
  { value: "by-attributes", label: "By Learner Attributes" },
  { value: "by-programs", label: "By Programs" },
  { value: "by-learner", label: "By Learner" },
  { value: "by-modules", label: "By Modules" },
];

const AUDIT_EVENTS = [
  {
    when: "Today 09:12",
    actor: "Ananya Rao",
    action: "Published module",
    target: "Quality Management 2026",
  },
  {
    when: "Today 08:40",
    actor: "Rahul Menon",
    action: "Changed due date",
    target: "Information Security 2026",
  },
  {
    when: "Yesterday 17:05",
    actor: "Priya Nair",
    action: "Assigned team",
    target: "Info Services → Onboarding",
  },
  {
    when: "Yesterday 11:22",
    actor: "System",
    action: "Auto-provisioned user",
    target: "ritika.sen@netscribes.com",
  },
  {
    when: "2 days ago",
    actor: "Ananya Rao",
    action: "Updated default certificate",
    target: "Netscribes Classic",
  },
  {
    when: "3 days ago",
    actor: "Vikram Iyer",
    action: "Unenrolled 12 learners",
    target: "Research Methods: Sourcing",
  },
  {
    when: "4 days ago",
    actor: "System",
    action: "Sent reminder batch",
    target: "Mandatory: ISO 27001",
  },
  {
    when: "5 days ago",
    actor: "Farah Sheikh",
    action: "Edited user",
    target: "imran.qureshi@netscribes.com",
  },
];

const MODULE_PROGRAM: Record<string, string> = {
  "Information Security 2026": "ISO Training",
  "Quality Management 2026": "ISO Training",
  "Company & Culture": "New Joiner Onboarding",
  "Research Methods: Sourcing": "Research Craft",
  "Client Communication Basics": "Research Craft",
  "Policies & Benefits": "New Joiner Onboarding",
  "Process Audit Readiness": "ISO Training",
  "Data Handling Refresher": "ISO Training",
};

type MetricId = Exclude<ReportId, "audit-log">;

interface MetricMeta {
  label: string;
  suffix: string;
  kind: "pct" | "hours" | "points" | "logins";
}

const METRIC: Record<MetricId, MetricMeta> = {
  "completion-ratio": { label: "Completion", suffix: "%", kind: "pct" },
  "time-spent": { label: "Total hours", suffix: "h", kind: "hours" },
  "leaderboard-points": { label: "Points", suffix: "", kind: "points" },
  login: { label: "Logins", suffix: "", kind: "logins" },
};

/** Deterministic small hash so the same entity always yields the same number. */
function seedNum(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

function magnitude(kind: MetricMeta["kind"], key: string): number {
  const r = seedNum(key);
  switch (kind) {
    case "pct":
      return 60 + Math.round(r * 39);
    case "hours":
      return 80 + Math.round(r * 560);
    case "points":
      return 420 + Math.round(r * 2180);
    case "logins":
      return 24 + Math.round(r * 300);
  }
}

function metricColumns(meta: MetricMeta): ReportColumn[] {
  if (meta.kind === "hours")
    return [
      { key: "hours", label: "Total hours", numeric: true },
      { key: "avgMins", label: "Avg mins / module", numeric: true },
    ];
  if (meta.kind === "logins")
    return [
      { key: "logins", label: "Logins", numeric: true },
      { key: "perWeek", label: "Avg / week", numeric: true },
    ];
  return [
    { key: "value", label: meta.label + (meta.suffix ? ` (${meta.suffix})` : ""), numeric: true },
  ];
}

function metricCells(meta: MetricMeta, key: string): Record<string, number> {
  const v = magnitude(meta.kind, key);
  if (meta.kind === "hours") return { hours: v, avgMins: 22 + (Math.round(v) % 26) };
  if (meta.kind === "logins") return { logins: v, perWeek: Math.max(1, Math.round(v / 12)) };
  return { value: v };
}

const REPORT_NAME: Record<ReportId, string> = {
  "completion-ratio": "Completion Ratio Report",
  "time-spent": "Time Spent Analytics",
  "leaderboard-points": "Leaderboard Points Report",
  login: "Login Reports",
  "audit-log": "Audit Logs",
};

function tabRows(
  id: MetricId,
  tab: ReportTab,
): { columns: ReportColumn[]; rows: Record<string, string | number>[] } {
  const meta = METRIC[id];
  const mc = metricColumns(meta);

  if (tab === "by-programs") {
    return {
      columns: [
        { key: "program", label: "Program" },
        { key: "modules", label: "Modules", numeric: true },
        { key: "learners", label: "Learners", numeric: true },
        ...mc,
      ],
      rows: PROGRAMS.map((program) => ({
        program,
        modules: 3 + Math.round(seedNum(program) * 6),
        learners: 60 + Math.round(seedNum(program + "l") * 240),
        ...metricCells(meta, id + program),
      })),
    };
  }

  if (tab === "by-modules") {
    return {
      columns: [
        { key: "module", label: "Module" },
        { key: "program", label: "Program" },
        { key: "enrolled", label: "Enrolled", numeric: true },
        ...mc,
      ],
      rows: MODULE_TITLES.map((module) => ({
        module,
        program: MODULE_PROGRAM[module] ?? "ISO Training",
        enrolled: 40 + Math.round(seedNum(module + "e") * 200),
        ...metricCells(meta, id + module),
      })),
    };
  }

  if (tab === "by-learner") {
    // Consistent learner attributes across every report: enrolled-on, status,
    // %, user status, manager, designation, division and function.
    const completion = id === "completion-ratio";
    return {
      columns: [
        { key: "name", label: "Learner" },
        { key: "entity", label: "Entity" },
        { key: "division", label: "Division" },
        { key: "functionArea", label: "Function" },
        { key: "department", label: "Department" },
        { key: "designation", label: "Designation" },
        { key: "manager", label: "Manager" },
        { key: "userStatus", label: "User status" },
        ...(completion
          ? [
              { key: "status", label: "Status" },
              { key: "pct", label: "%", numeric: true as const },
            ]
          : mc),
      ],
      rows: users.slice(0, 24).map((u, i) => {
        const cells = metricCells(meta, id + u.id);
        const pct = completion ? (cells["value"] as number) : 0;
        const status = pct >= 100 ? "Completed" : pct === 0 ? "Not started" : "In progress";
        return {
          name: u.name,
          entity: u.entity,
          division: u.team,
          functionArea: u.functionArea,
          department: u.department,
          location: u.location,
          employeeType: u.employeeType,
          projectName: u.projectName,
          designation: u.designation,
          manager: u.manager,
          userStatus: u.userStatus,
          enrolledOn: u.joiningDate,
          ...(completion
            ? {
                status: pct >= 100 ? (i % 6 === 0 ? "Failed" : "Passed") : status,
                pct: Math.min(100, pct),
              }
            : cells),
        };
      }),
    };
  }

  if (tab === "by-attributes") {
    const segments: { attribute: string; segment: string; learners: number }[] = [
      ...DEPARTMENTS.map((d) => ({
        attribute: "Department",
        segment: d,
        learners: 40 + Math.round(seedNum(d) * 180),
      })),
      ...LOCATIONS.map((l) => ({
        attribute: "Location",
        segment: l,
        learners: 30 + Math.round(seedNum(l) * 160),
      })),
      ...EMPLOYEE_TYPES.map((t) => ({
        attribute: "Employee type",
        segment: t,
        learners: 20 + Math.round(seedNum(t) * 200),
      })),
      ...ENTITIES_LIST.map((e) => ({
        attribute: "Entity",
        segment: e,
        learners: 40 + Math.round(seedNum(e) * 260),
      })),
      ...PROJECTS.map((p) => ({
        attribute: "Project",
        segment: p,
        learners: 15 + Math.round(seedNum(p) * 120),
      })),
    ];
    return {
      columns: [
        { key: "attribute", label: "Attribute" },
        { key: "segment", label: "Segment" },
        { key: "learners", label: "Learners", numeric: true },
        ...mc,
      ],
      rows: segments.map((s) => ({ ...s, ...metricCells(meta, id + s.segment) })),
    };
  }

  // dashboard summary table — by team
  return {
    columns: [
      { key: "team", label: "Team" },
      { key: "learners", label: "Learners", numeric: true },
      ...mc,
    ],
    rows: TEAMS.map((team) => ({
      team,
      learners: 30 + Math.round(seedNum(team + "d") * 160),
      ...metricCells(meta, id + team),
    })),
  };
}

function metricValue(id: MetricId, key: string): number {
  const meta = METRIC[id];
  const cells = metricCells(meta, key);
  return (cells["value"] ?? cells["hours"] ?? cells["logins"]) as number;
}

function dashboardExtras(id: MetricId): { kpis: ReportKpi[]; charts: ReportChart[] } {
  const meta = METRIC[id];
  const teamBar: ReportChart = {
    kind: "bar",
    title: `${meta.label} by team`,
    suffix: meta.suffix,
    series: TEAMS.map((team) => ({
      label: team,
      value: metricValue(id, id + team),
      tint: "var(--chart-1)",
    })),
  };

  if (id === "completion-ratio") {
    const complete = 68;
    const inProgress = 21;
    const notStarted = 11;
    return {
      kpis: [
        { label: "Avg completion", value: 78, suffix: "%", tint: "var(--chart-1)" },
        { label: "Modules assigned", value: 3470, tint: "var(--chart-2)" },
        { label: "Completed", value: 2683, tint: "var(--status-complete)" },
        { label: "Overdue", value: 214, tint: "var(--status-overdue)" },
      ],
      charts: [
        teamBar,
        {
          kind: "donut",
          title: "Status split",
          suffix: "%",
          series: [
            { label: "Complete", value: complete, tint: "var(--status-complete)" },
            { label: "In progress", value: inProgress, tint: "var(--status-progress)" },
            { label: "Not started", value: notStarted, tint: "var(--muted-foreground)" },
          ],
        },
      ],
    };
  }

  if (id === "time-spent") {
    return {
      kpis: [
        { label: "Total hours", value: 1641, suffix: "h", tint: "var(--chart-1)" },
        { label: "Avg mins / module", value: 34, tint: "var(--chart-4)" },
        { label: "Active learners", value: 410, tint: "var(--chart-2)" },
        { label: "Modules", value: 48, tint: "var(--chart-3)" },
      ],
      charts: [teamBar],
    };
  }

  if (id === "leaderboard-points") {
    return {
      kpis: [
        { label: "Total points", value: 84200, tint: "var(--chart-1)" },
        { label: "Top scorer", value: 2840, tint: "var(--chart-4)" },
        { label: "Avg points", value: 1180, tint: "var(--chart-2)" },
        { label: "Learners", value: 410, tint: "var(--chart-3)" },
      ],
      charts: [
        {
          kind: "bar",
          title: "Top learners",
          series: users.slice(0, 6).map((u) => ({
            label: u.name,
            value: metricValue(id, id + u.id),
            tint: "var(--chart-1)",
          })),
        },
      ],
    };
  }

  // login
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  return {
    kpis: [
      { label: "Total logins", value: 9840, tint: "var(--chart-1)" },
      { label: "Avg / week", value: 820, tint: "var(--chart-2)" },
      { label: "Active users", value: 388, tint: "var(--status-complete)" },
      { label: "Peak day", value: 342, tint: "var(--chart-4)" },
    ],
    charts: [
      {
        kind: "line",
        title: "Logins by month",
        series: months.map((m) => ({
          label: m,
          value: 900 + Math.round(seedNum("login" + m) * 900),
        })),
      },
      teamBar,
    ],
  };
}

function auditReport(tab: ReportTab): ReportDetail {
  const base = {
    id: "audit-log" as const,
    name: "Audit Log",
    description:
      "Administrative changes across Lessons — assignments, publishes, settings, access.",
    tab,
  };

  if (tab === "dashboard") {
    const byActor = new Map<string, number>();
    AUDIT_EVENTS.forEach((e) => byActor.set(e.actor, (byActor.get(e.actor) ?? 0) + 1));
    return {
      ...base,
      kpis: [
        { label: "Events today", value: 2, tint: "var(--chart-1)" },
        { label: "This week", value: AUDIT_EVENTS.length, tint: "var(--chart-2)" },
        { label: "Actors", value: byActor.size, tint: "var(--chart-3)" },
        {
          label: "Automated",
          value: AUDIT_EVENTS.filter((e) => e.actor === "System").length,
          tint: "var(--chart-4)",
        },
      ],
      charts: [
        {
          kind: "bar",
          title: "Events by actor",
          series: Array.from(byActor.entries()).map(([label, value]) => ({
            label,
            value,
            tint: "var(--chart-1)",
          })),
        },
      ],
      columns: [
        { key: "when", label: "When" },
        { key: "actor", label: "Actor" },
        { key: "action", label: "Action" },
        { key: "target", label: "Target" },
      ],
      rows: AUDIT_EVENTS,
    };
  }

  if (tab === "by-learner") {
    const byActor = new Map<string, { events: number; last: string }>();
    AUDIT_EVENTS.forEach((e) => {
      const cur = byActor.get(e.actor);
      if (cur) cur.events += 1;
      else byActor.set(e.actor, { events: 1, last: e.action });
    });
    return {
      ...base,
      columns: [
        { key: "actor", label: "Actor" },
        { key: "events", label: "Events", numeric: true },
        { key: "last", label: "Most recent action" },
      ],
      rows: Array.from(byActor.entries()).map(([actor, v]) => ({
        actor,
        events: v.events,
        last: v.last,
      })),
    };
  }

  return {
    ...base,
    columns: [
      { key: "when", label: "When" },
      { key: "actor", label: "Actor" },
      { key: "action", label: "Action" },
      { key: "target", label: "Target" },
    ],
    rows: AUDIT_EVENTS,
  };
}

/** Build a report for a given tab. Server owns the real query engine. */
export function reportDetail(id: ReportId, tab: ReportTab = "dashboard"): ReportDetail | null {
  if (!REPORT_NAME[id]) return null;
  if (id === "audit-log") return auditReport(tab);

  const summary = reports.find((r) => r.id === id)!;
  const { columns, rows } = tabRows(id, tab);
  const base: ReportDetail = {
    id,
    name: REPORT_NAME[id],
    description: summary.description,
    tab,
    columns,
    rows,
  };
  if (tab === "dashboard") {
    const extra = dashboardExtras(id);
    return { ...base, kpis: extra.kpis, charts: extra.charts };
  }
  return base;
}

/* ============================================================
 * MODULE COMPLETION DETAIL — Reports → Completion → By Modules.
 * The scores / pass-fail / certificate view, keyed by module, so it lives
 * inside the completion report rather than a separate section.
 * ============================================================ */

/** Which modules carry a compliance-tracked quiz + issue a certificate. */
const MODULE_MANDATORY: Record<string, boolean> = {};
function moduleFlags(moduleId: string): {
  mandatory: boolean;
  hasCertificate: boolean;
  passMark: number;
} {
  const r = seedNum(moduleId);
  const mandatory = MODULE_MANDATORY[moduleId] ?? r > 0.4;
  return {
    mandatory,
    hasCertificate: mandatory || r > 0.6,
    passMark: mandatory ? 70 + Math.round(seedNum(moduleId + "p") * 15) : 60,
  };
}

const COMPLETED_DATES = ["2026-07-22", "2026-08-05", "2026-08-19", "2026-09-02", "2026-09-11"];

export function moduleCompletionDetail(moduleId: string): ModuleCompletionDetail | null {
  const mod = assignableModules.find((m) => m.id === moduleId);
  if (!mod) return null;
  const { mandatory, hasCertificate, passMark } = moduleFlags(moduleId);
  const seed = seedNum(moduleId + "d");
  // A stable per-module slice of the directory so the demo stays consistent.
  const size = 14 + Math.round(seed * 10);
  const start = Math.round(seed * 40);
  const people = Array.from({ length: size }, (_, i) => users[(start + i) % users.length]!);

  const rows: ModuleCompletionRow[] = people.map((u, i) => {
    const n = (i * 7 + moduleId.length) % 10;
    const status: ModuleCompletionRow["status"] =
      n < 2 ? "not-started" : n < 5 ? "in-progress" : "complete";
    const scorePct = status === "complete" ? 52 + ((i * 13 + moduleId.length) % 48) : null;
    const outcome: ModuleCompletionRow["outcome"] =
      scorePct === null ? null : scorePct >= passMark ? "pass" : "fail";
    return {
      learnerId: u.id,
      userId: u.userId,
      name: u.name,
      email: u.email,
      team: u.team,
      entity: u.entity,
      department: u.department,
      location: u.location,
      status,
      scorePct,
      outcome,
      completedOn:
        status === "complete"
          ? COMPLETED_DATES[(i + moduleId.length) % COMPLETED_DATES.length]!
          : null,
      attempts: status === "not-started" ? 0 : 1 + (i % 3),
      certificate: hasCertificate && outcome === "pass",
    };
  });

  const completed = rows.filter((r) => r.status === "complete").length;
  const passed = rows.filter((r) => r.outcome === "pass").length;
  const scored = rows.filter((r) => r.scorePct !== null).length;
  return {
    meta: {
      moduleId,
      moduleTitle: mod.title,
      programTitle: mod.programTitle,
      skillTitle: mod.skillTitle,
      mandatory,
      passMarkPct: passMark,
      hasCertificate,
      enrolled: rows.length,
      completed,
      completionPct: rows.length ? Math.round((completed / rows.length) * 100) : 0,
      passRatePct: scored ? Math.round((passed / scored) * 100) : 0,
      dueDate: "2026-12-31",
    },
    rows,
  };
}

/* ============================================================
 * CONFIG SURFACES — mock state for the thin admin controls.
 * ============================================================ */

export const notificationSettings: NotificationSetting[] = [
  {
    id: "n-assign",
    label: "New assignment",
    description: "When a module is assigned to a learner.",
    channels: { email: true, inApp: true, push: false },
  },
  {
    id: "n-due",
    label: "Due date reminder",
    description: "A few days before a module is due.",
    channels: { email: true, inApp: true, push: true },
  },
  {
    id: "n-overdue",
    label: "Overdue nudge",
    description: "When a mandatory module slips past its due date.",
    channels: { email: true, inApp: true, push: true },
  },
  {
    id: "n-complete",
    label: "Completion & certificate",
    description: "When a learner finishes and earns a credential.",
    channels: { email: true, inApp: false, push: false },
  },
  {
    id: "n-digest",
    label: "Weekly digest",
    description: "A Monday summary of learning activity.",
    channels: { email: false, inApp: false, push: false },
  },
];

export const enrollmentRules: EnrollmentRule[] = [
  {
    id: "er-1",
    attribute: "Department",
    value: "Research",
    moduleTitle: "Research Methods: Sourcing",
    enabled: true,
  },
  {
    id: "er-2",
    attribute: "Employee type",
    value: "full-time",
    moduleTitle: "Company & Culture",
    enabled: true,
  },
  {
    id: "er-3",
    attribute: "Location",
    value: "Noida",
    moduleTitle: "Policies & Benefits",
    enabled: false,
  },
  {
    id: "er-4",
    attribute: "Function",
    value: "Sales",
    moduleTitle: "Client Communication Basics",
    enabled: true,
  },
];

export const pointsRules: PointsRule[] = [
  { id: "pr-1", event: "Complete a module", points: 100, perModuleCap: 100, enabled: true },
  { id: "pr-2", event: "Pass a quiz first try", points: 50, perModuleCap: 50, enabled: true },
  { id: "pr-3", event: "Finish before due date", points: 25, perModuleCap: 25, enabled: true },
  { id: "pr-4", event: "Daily login streak", points: 5, perModuleCap: 35, enabled: false },
];

export const platformSettings: PlatformSettings = {
  terminology: {
    moduleLabel: "Module",
    programLabel: "Program",
    skillLabel: "Skill",
    learnerLabel: "Learner",
  },
  banners: [
    {
      id: "b-1",
      title: "ISO audit window opens 12 March",
      audience: "All employees",
      active: true,
    },
    {
      id: "b-2",
      title: "New joiner orientation every Monday",
      audience: "New joiners",
      active: true,
    },
    {
      id: "b-3",
      title: "Year-end certificates available",
      audience: "All employees",
      active: false,
    },
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
