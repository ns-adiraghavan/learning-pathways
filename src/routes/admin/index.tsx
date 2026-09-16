import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ClipboardList, Settings2, ShieldCheck, Users } from "lucide-react";

import { getMandatoryQuizzes } from "@/data/repositories";
import { useCountUp } from "@/components/lessons/count-up";
import { Progress } from "@/components/ui/progress";

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
  },
  {
    title: "Assignments",
    description: "Pick a module, edit who is assigned and when it is due.",
    to: "/admin/assignments",
    icon: ClipboardList,
  },
  {
    title: "Reports",
    description: "Completion ratio, time spent, leaderboard points and the audit log.",
    to: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Mandatory Quizzes",
    description: "See who has and hasn't completed each compliance-tracked quiz.",
    to: "/admin/mandatory-quizzes",
    icon: ShieldCheck,
  },
  {
    title: "Customization",
    description: "Labels, banners, notification types and the default certificate.",
    to: "/admin/customization",
    icon: Settings2,
  },
] as const;

function MandatoryComplianceKpi() {
  const { data: quizzes = [] } = useQuery({
    queryKey: ["mandatory-quizzes"],
    queryFn: getMandatoryQuizzes,
  });

  const enrolled = quizzes.reduce((sum, q) => sum + q.enrolled, 0);
  const completed = quizzes.reduce((sum, q) => sum + q.completed, 0);
  const pct = enrolled ? Math.round((completed / enrolled) * 100) : 0;
  const shown = useCountUp(pct);

  return (
    <Link
      to="/admin/mandatory-quizzes"
      className="surface surface-hover mb-5 block p-5"
      aria-label="Mandatory completion"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-label text-muted-foreground">Mandatory completion</p>
          <p className="tnum mt-1 text-3xl font-[510]">
            {shown}
            <span className="text-base text-muted-foreground">%</span>
          </p>
          <p className="tnum mt-1 text-sm text-muted-foreground">
            {completed} of {enrolled} across {quizzes.length} mandatory quizzes
          </p>
        </div>
        <ShieldCheck className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <Progress value={pct} className="mt-3 h-1.5" />
    </Link>
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

      <MandatoryComplianceKpi />

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="surface surface-hover block p-5">
            <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-muted">
              <c.icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <h2 className="text-card-title">{c.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
