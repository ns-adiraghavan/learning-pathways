import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/progress")({
  beforeLoad: () => {
    throw redirect({ to: "/my-learning", search: { status: "all" as const } });
  },
});
