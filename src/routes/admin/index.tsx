import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, ClipboardList, Settings2, Users } from "lucide-react";

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
    title: "Customization",
    description: "Labels, banners, notification types and the default certificate.",
    to: "/admin/customization",
    icon: Settings2,
  },
] as const;

function AdminHome() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-title">Administration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Four jobs, nothing else. Users are normally auto-provisioned from HR.
        </p>
      </header>

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
