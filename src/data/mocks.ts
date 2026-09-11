import posterOnboarding from "@/assets/poster-onboarding.jpg";
import posterMandatory from "@/assets/poster-mandatory.jpg";
import posterTeam from "@/assets/poster-team.jpg";
import posterBank from "@/assets/poster-bank.jpg";

import type {
  Certificate,
  LeaderboardEntry,
  LearningModule,
  Notification,
  PendingAction,
  QuizQuestion,
  User,
} from "./types";

const SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

const posters = {
  onboarding: posterOnboarding,
  mandatory: posterMandatory,
  team: posterTeam,
  bank: posterBank,
} as const;

function q(
  id: string,
  prompt: string,
  difficulty: QuizQuestion["difficulty"],
  options: string[],
  correctIndex: number,
): QuizQuestion {
  return {
    id,
    prompt,
    difficulty,
    options: options.map((label, i) => ({ id: `${id}-o${i}`, label })),
    correctOptionId: `${id}-o${correctIndex}`,
  };
}

export const currentUser: User = {
  id: "u-1",
  name: "Ananya Rao",
  email: "ananya.rao@netscribes.com",
  role: "learner",
  team: "Market Intelligence",
};

export const modules: LearningModule[] = [
  {
    id: "m-welcome",
    title: "Welcome to Netscribes",
    description:
      "Your first week, decoded. Who we are, how we work, the teams you'll meet, and the tools you'll live in. Covers our history, service lines, client promise, and the everyday rituals that keep delivery running smoothly across offices.",
    posterImage: posters.onboarding,
    category: "onboarding",
    dueDate: "2026-09-18",
    status: "in-progress",
    progressPct: 45,
    orderLocked: true,
    activities: [
      {
        id: "a-welcome-1",
        name: "A tour of Netscribes",
        type: "video",
        src: SAMPLE_VIDEO,
        durationMins: 8,
        required: true,
        enforceFocus: true,
      },
      {
        id: "a-welcome-2",
        name: "Org structure & service lines",
        type: "deck",
        src: "#",
        pages: 12,
        required: true,
      },
      {
        id: "a-welcome-3",
        name: "Onboarding checklist",
        type: "weblink",
        url: "https://www.netscribes.com",
        required: false,
      },
      {
        id: "a-welcome-4",
        name: "Know your workplace quiz",
        type: "quiz",
        templateId: "tpl-onboarding",
        required: true,
        timeLimitMins: 6,
        shuffle: true,
        questions: [
          q("qw1", "What is Netscribes' primary offering?", "easy", [
            "Market intelligence and data solutions",
            "Consumer electronics manufacturing",
            "Freight logistics",
            "Retail banking",
          ], 0),
          q("qw2", "Where should a new joiner raise IT access requests?", "easy", [
            "Directly to the CEO",
            "The internal IT helpdesk portal",
            "A public forum",
            "Their client's IT team",
          ], 1),
          q("qw3", "Which ritual keeps delivery teams aligned each morning?", "medium", [
            "Quarterly town hall",
            "Annual appraisal",
            "Daily stand-up",
            "Monthly newsletter",
          ], 2),
          q("qw4", "Who owns the client relationship on a research engagement?", "hard", [
            "The engagement manager",
            "Any available analyst",
            "The design team",
            "Nobody in particular",
          ], 0),
        ],
      },
    ],
  },
  {
    id: "m-infosec",
    title: "Information Security Essentials",
    description:
      "Mandatory annual refresher on data handling, phishing, device hygiene and client confidentiality. Completing this is required to retain access to client project workspaces.",
    posterImage: posters.mandatory,
    category: "mandatory",
    dueDate: "2026-09-12",
    status: "overdue",
    progressPct: 20,
    orderLocked: true,
    activities: [
      {
        id: "a-sec-1",
        name: "Threats you'll actually meet",
        type: "video",
        src: SAMPLE_VIDEO,
        durationMins: 11,
        required: true,
        enforceFocus: true,
      },
      {
        id: "a-sec-2",
        name: "Data classification handbook",
        type: "deck",
        src: "#",
        pages: 18,
        required: true,
      },
      {
        id: "a-sec-3",
        name: "Security assessment",
        type: "quiz",
        templateId: "tpl-infosec",
        required: true,
        timeLimitMins: 10,
        shuffle: false,
        questions: [
          q("qs1", "A vendor emails asking for a client list urgently. You:", "easy", [
            "Send it to keep them happy",
            "Verify through a known channel before acting",
            "Forward it to your team",
            "Post it in a shared drive",
          ], 1),
          q("qs2", "Which is safest for sharing a confidential report?", "medium", [
            "Personal cloud drive link",
            "Approved client workspace with access control",
            "WhatsApp",
            "USB drive left at reception",
          ], 1),
          q("qs3", "Client data must be stored for how long after project close?", "hard", [
            "Forever",
            "Only as long as the contract's retention clause allows",
            "Until you need the space",
            "Six months, always",
          ], 1),
          q("qs4", "Strongest signal of a phishing email:", "easy", [
            "It has a company logo",
            "Mismatched sender domain and urgent tone",
            "It arrives on Monday",
            "It's short",
          ], 1),
          q("qs5", "Your laptop is stolen while travelling. First step:", "medium", [
            "Wait until you're back in office",
            "Report to IT security immediately",
            "Buy a new one",
            "Change your email signature",
          ], 1),
        ],
      },
    ],
  },
  {
    id: "m-poshcode",
    title: "Code of Conduct & POSH",
    description:
      "Our behavioural standards, the prevention of sexual harassment framework, and how to raise a concern safely. Required for every employee, every year.",
    posterImage: posters.mandatory,
    category: "mandatory",
    dueDate: "2026-09-30",
    status: "not-started",
    progressPct: 0,
    orderLocked: true,
    activities: [
      {
        id: "a-posh-1",
        name: "Policy walkthrough",
        type: "deck",
        src: "#",
        pages: 22,
        required: true,
      },
      {
        id: "a-posh-2",
        name: "Scenarios and responses",
        type: "video",
        src: SAMPLE_VIDEO,
        durationMins: 9,
        required: true,
        enforceFocus: true,
      },
      {
        id: "a-posh-3",
        name: "Acknowledgement quiz",
        type: "quiz",
        templateId: "tpl-posh",
        required: true,
        timeLimitMins: 5,
        shuffle: true,
        questions: [
          q("qp1", "Who can raise a POSH complaint?", "easy", [
            "Only full-time employees",
            "Any employee, contractor or intern",
            "Only managers",
            "Only HR",
          ], 1),
          q("qp2", "The internal committee must resolve a complaint within:", "medium", [
            "90 days",
            "1 year",
            "No fixed timeline",
            "7 days",
          ], 0),
          q("qp3", "Retaliation against a complainant is:", "easy", [
            "Acceptable if the complaint is false",
            "A separate punishable offence",
            "A manager's discretion",
            "Not covered by policy",
          ], 1),
        ],
      },
    ],
  },
  {
    id: "m-research",
    title: "Research Methods for Analysts",
    description:
      "Primary versus secondary research, sampling, source credibility and how to structure findings so a client can act on them within a single read.",
    posterImage: posters.team,
    category: "team",
    dueDate: "2026-10-05",
    status: "in-progress",
    progressPct: 66,
    orderLocked: false,
    activities: [
      {
        id: "a-res-1",
        name: "Designing a research plan",
        type: "video",
        src: SAMPLE_VIDEO,
        durationMins: 14,
        required: true,
        enforceFocus: false,
      },
      {
        id: "a-res-2",
        name: "Source credibility framework",
        type: "deck",
        src: "#",
        pages: 9,
        required: true,
      },
      {
        id: "a-res-3",
        name: "Methods check",
        type: "quiz",
        templateId: "tpl-research",
        required: true,
        timeLimitMins: 8,
        shuffle: true,
        questions: [
          q("qr1", "Interviewing 20 buyers is which kind of research?", "easy", [
            "Secondary",
            "Primary",
            "Tertiary",
            "Desk",
          ], 1),
          q("qr2", "A vendor-published market size should be:", "medium", [
            "Quoted as fact",
            "Triangulated against independent sources",
            "Ignored entirely",
            "Rounded up",
          ], 1),
          q("qr3", "Best guard against sampling bias in a B2B survey:", "hard", [
            "Larger sample from the same list",
            "Stratified sampling across segments",
            "Asking fewer questions",
            "Longer field window only",
          ], 1),
        ],
      },
    ],
  },
  {
    id: "m-clientcomm",
    title: "Client Communication Craft",
    description:
      "Writing status notes, running review calls, and handling scope conversations without friction. Built from real engagement transcripts.",
    posterImage: posters.team,
    category: "team",
    dueDate: "2026-10-14",
    status: "not-started",
    progressPct: 0,
    orderLocked: false,
    activities: [
      {
        id: "a-cc-1",
        name: "Anatomy of a good status note",
        type: "deck",
        src: "#",
        pages: 11,
        required: true,
      },
      {
        id: "a-cc-2",
        name: "Handling a scope change",
        type: "video",
        src: SAMPLE_VIDEO,
        durationMins: 7,
        required: false,
        enforceFocus: false,
      },
      {
        id: "a-cc-3",
        name: "Communication scenarios quiz",
        type: "quiz",
        templateId: "tpl-comm",
        required: true,
        timeLimitMins: 6,
        shuffle: false,
        questions: [
          q("qc1", "A client asks for extra analysis mid-sprint. You first:", "easy", [
            "Say yes immediately",
            "Clarify the ask and its impact on timeline",
            "Ignore it",
            "Escalate to legal",
          ], 1),
          q("qc2", "A weekly status note should lead with:", "medium", [
            "Hours logged",
            "Decisions needed and risks",
            "A greeting paragraph",
            "Tooling notes",
          ], 1),
          q("qc3", "Bad news on a deliverable is best delivered:", "hard", [
            "In the final report",
            "Early, with options and a recovery plan",
            "By a junior analyst",
            "Not at all",
          ], 1),
        ],
      },
    ],
  },
  {
    id: "m-datavis",
    title: "Data Visualisation Fundamentals",
    description:
      "Chart choice, honest axes, annotation and the small typographic decisions that make a slide readable in five seconds.",
    posterImage: posters.bank,
    category: "bank",
    dueDate: "2026-11-02",
    status: "complete",
    progressPct: 100,
    orderLocked: false,
    activities: [
      {
        id: "a-dv-1",
        name: "Choosing the right chart",
        type: "video",
        src: SAMPLE_VIDEO,
        durationMins: 12,
        required: true,
        enforceFocus: false,
      },
      {
        id: "a-dv-2",
        name: "Chart clinic deck",
        type: "deck",
        src: "#",
        pages: 16,
        required: true,
      },
      {
        id: "a-dv-3",
        name: "Visual literacy quiz",
        type: "quiz",
        templateId: "tpl-dataviz",
        required: true,
        timeLimitMins: 7,
        shuffle: true,
        questions: [
          q("qd1", "Best chart for share of a whole across 4 segments:", "easy", [
            "Stacked bar",
            "Scatter plot",
            "Line chart",
            "Gantt",
          ], 0),
          q("qd2", "Truncating a bar chart's y-axis at a non-zero value:", "medium", [
            "Is always fine",
            "Exaggerates differences and misleads",
            "Improves accuracy",
            "Is required",
          ], 1),
          q("qd3", "Most effective annotation on a trend line:", "hard", [
            "Colouring every point",
            "Labelling the inflection and its cause",
            "Adding a legend only",
            "3D depth",
          ], 1),
        ],
      },
    ],
  },
  {
    id: "m-genai",
    title: "Generative AI at Work",
    description:
      "Where AI tools help a research workflow, where they quietly hurt it, and the guardrails to apply before anything touches a client deliverable.",
    posterImage: posters.bank,
    category: "bank",
    dueDate: "2026-11-20",
    status: "in-progress",
    progressPct: 30,
    orderLocked: false,
    activities: [
      {
        id: "a-ai-1",
        name: "Practical prompting",
        type: "video",
        src: SAMPLE_VIDEO,
        durationMins: 10,
        required: true,
        enforceFocus: false,
      },
      {
        id: "a-ai-2",
        name: "Responsible use guidelines",
        type: "weblink",
        url: "https://www.netscribes.com",
        required: true,
      },
      {
        id: "a-ai-3",
        name: "AI guardrails quiz",
        type: "quiz",
        templateId: "tpl-genai",
        required: true,
        timeLimitMins: 5,
        shuffle: true,
        questions: [
          q("qa1", "Pasting client raw data into a public AI tool is:", "easy", [
            "Encouraged",
            "A confidentiality breach",
            "Fine if anonymised by eye",
            "Required for speed",
          ], 1),
          q("qa2", "An AI-generated market figure should be:", "medium", [
            "Cited as-is",
            "Verified against a primary source",
            "Rounded",
            "Deleted",
          ], 1),
          q("qa3", "Best use of AI in a research sprint:", "hard", [
            "Writing the final client conclusion",
            "Accelerating first-pass synthesis you then verify",
            "Choosing the client's strategy",
            "Replacing peer review",
          ], 1),
        ],
      },
    ],
  },
  {
    id: "m-benefits",
    title: "Benefits, Leave & Payroll",
    description:
      "How leave accrual works, what your insurance actually covers, reimbursement timelines, and the payroll calendar for the year.",
    posterImage: posters.onboarding,
    category: "onboarding",
    dueDate: "2026-09-25",
    status: "not-started",
    progressPct: 0,
    orderLocked: false,
    activities: [
      {
        id: "a-ben-1",
        name: "Benefits overview deck",
        type: "deck",
        src: "#",
        pages: 14,
        required: true,
      },
      {
        id: "a-ben-2",
        name: "Employee portal",
        type: "weblink",
        url: "https://www.netscribes.com",
        required: false,
      },
      {
        id: "a-ben-3",
        name: "Benefits quick quiz",
        type: "quiz",
        templateId: "tpl-benefits",
        required: true,
        timeLimitMins: 4,
        shuffle: false,
        questions: [
          q("qb1", "Casual leave accrues:", "easy", [
            "Monthly",
            "Only in December",
            "Never",
            "Every three years",
          ], 0),
          q("qb2", "Reimbursement claims must be filed within:", "medium", [
            "30 days of expense",
            "2 years",
            "Any time",
            "Same day only",
          ], 0),
        ],
      },
    ],
  },
];

export const pendingActions: PendingAction[] = [
  {
    id: "pa-1",
    kind: "survey",
    title: "Onboarding experience survey",
    dueDate: "2026-09-15",
    moduleId: "m-welcome",
  },
  {
    id: "pa-2",
    kind: "esignature",
    title: "Information security declaration",
    dueDate: "2026-09-12",
    moduleId: "m-infosec",
  },
  {
    id: "pa-3",
    kind: "esignature",
    title: "Code of conduct acknowledgement",
    dueDate: "2026-09-30",
    moduleId: "m-poshcode",
  },
];

export const certificates: Certificate[] = [
  {
    id: "c-1",
    moduleId: "m-datavis",
    title: "Data Visualisation Fundamentals",
    issuedOn: "2026-08-21",
    credentialId: "NS-DVF-20260821-4417",
  },
  {
    id: "c-2",
    moduleId: "m-archive-excel",
    title: "Advanced Excel for Analysts",
    issuedOn: "2026-06-04",
    credentialId: "NS-AEA-20260604-1182",
  },
];

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: "u-8", name: "Rohit Menon", team: "Data Solutions", modulesComplete: 14, points: 2840, isCurrentUser: false },
  { rank: 2, userId: "u-3", name: "Sneha Kulkarni", team: "Market Intelligence", modulesComplete: 12, points: 2510, isCurrentUser: false },
  { rank: 3, userId: "u-5", name: "Imran Sheikh", team: "Technology", modulesComplete: 11, points: 2300, isCurrentUser: false },
  { rank: 4, userId: "u-1", name: "Ananya Rao", team: "Market Intelligence", modulesComplete: 9, points: 1960, isCurrentUser: true },
  { rank: 5, userId: "u-7", name: "Divya Nair", team: "Consulting", modulesComplete: 8, points: 1740, isCurrentUser: false },
  { rank: 6, userId: "u-2", name: "Karan Gupta", team: "Data Solutions", modulesComplete: 7, points: 1520, isCurrentUser: false },
  { rank: 7, userId: "u-9", name: "Meera Iyer", team: "Design", modulesComplete: 6, points: 1310, isCurrentUser: false },
  { rank: 8, userId: "u-4", name: "Aditya Bose", team: "Technology", modulesComplete: 5, points: 1120, isCurrentUser: false },
];

export const notifications: Notification[] = [
  {
    id: "n-1",
    title: "Information Security Essentials is overdue",
    body: "It was due on 12 Sep. Finish the assessment to keep workspace access.",
    createdAt: "2026-09-11T04:10:00Z",
    read: false,
  },
  {
    id: "n-2",
    title: "New module assigned",
    body: "Client Communication Craft was added to your plan.",
    createdAt: "2026-09-09T11:02:00Z",
    read: false,
  },
  {
    id: "n-3",
    title: "Certificate issued",
    body: "Data Visualisation Fundamentals — credential NS-DVF-20260821-4417.",
    createdAt: "2026-08-21T09:30:00Z",
    read: true,
  },
];
