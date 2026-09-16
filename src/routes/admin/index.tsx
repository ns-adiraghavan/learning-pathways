import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ClipboardList, Settings2, ShieldCheck, Users } from "lucide-react";

import { getAssignableModules, getMandatoryQuizzes, getUsers } from "@/data/repositories";
import { StatTile } from "@/components/lessons/count-up";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Administration — Lessons" },
      {
        name: "description",
        content:
          "Manage Netscribes Lessons users, course assignments, reports and platform labels.",
      },
      { property: "og:title", content: "Administration — Lessons" },
      {
        property: "og:description",
        content:
          "Manage Netscribes Lessons users, course assignments, reports and platform labels.",
      },
    ],
  }),
  component: AdminHome,
});

const cards = [
  {
    title: "Users & Progress",
    description: "Find anyone, see what they are assigned and how far along they are.",
    to: "/admin/users",
    icon: Users,
    tint: "var(--chart-1)",
  },
  {
    title: "Assignments",
    description: "Pick a module, edit who is assigned and when it is due.",
    to: "/admin/assignments",
    icon: ClipboardList,
    tint: "var(--chart-2)",
  },
  {
    title: "Reports",
    description: "Completion ratio, time spent, leaderboard points and the audit log.",
    to: "/admin/reports",
    icon: BarChart3,
    tint: "var(--chart-3)",
  },
  {
    title: "Mandatory Quizzes",
    description: "See who has and hasn't completed each compliance-tracked quiz.",
    to: "/admin/mandatory-quizzes",
    icon: ShieldCheck,
    tint: "var(--chart-5)",
  },
  {
    title: "Customization",
    description: "Labels, banners, notification types and the default certificate.",
    to: "/admin/customization",
    icon: Settings2,
    tint: "var(--chart-4)",
  },
] as const;

function AdminKpis() {
  const { data: quizzes = [] } = useQuery({
    queryKey: ["mandatory-quizzes"],
    queryFn: getMandatoryQuizzes,
  });
  const { data: users = [] } = useQuery({ queryKey: ["admin-users", ""], queryFn: () => getUsers() });
  const { data: modules = [] } = useQuery({ queryKey: ["assignable-modules"], queryFn: getAssignableModules });

  const enrolled = quizzes.reduce((sum, q) => sum + q.enrolled, 0);
  const completed = quizzes.reduce((sum, q) => sum + q.completed, 0);
  const pct = enrolled ? Math.round((completed / enrolled) * 100) : 0;
  const active = users.filter(
    (user) => user.role === "Learner" && user.lastActive !== "Never",
  ).length;
  const overdue = quizzes.reduce((sum, quiz) => sum + quiz.notCompleted, 0);

  return (
    <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Administration summary">
      <StatTile label="Active learners" value={active} tint="var(--chart-1)" tone="solid" />
      <Link to="/admin/mandatory-quizzes" aria-label="View mandatory completion">
        <StatTile label="Mandatory completion" value={pct} suffix="%" tint="var(--chart-2)" tone="solid" />
      </Link>
      <StatTile label="Modules live" value={modules.length} tint="var(--chart-3)" tone="soft" />
      <StatTile label="Overdue" value={overdue} tint="var(--chart-5)" tone="soft" />
    </section>
  );
}

function AdminHome() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-title">Administration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Four jobs, nothing else. Users are normally auto-provisioned from HR.
        </p>
      </header>

      <AdminKpis />

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="surface tinted-surface surface-hover relative block overflow-hidden p-5 pl-6"
            style={{ ["--tile-tint" as string]: c.tint }}
          >
            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-(--tile-tint)" />
            <div className="icon-chip mb-3 flex size-9 items-center justify-center rounded-md">
              <c.icon className="size-4" strokeWidth={1.75} />
            </div>
            <h2 className="text-card-title">{c.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
