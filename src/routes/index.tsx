import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileSignature, ClipboardList, PartyPopper } from "lucide-react";

import { getAssignedModules, getCurrentUser, getPendingActions } from "@/data/repositories";
import type { LearningModule, ModuleCategory } from "@/data/types";
import { CATEGORY_LABEL, formatDate } from "@/lib/format";
import { ModuleCard } from "@/components/lessons/module-card";
import { EmptyState } from "@/components/lessons/empty-state";
import { PageFade, ShimmerBlock, Stagger, StaggerItem } from "@/components/motion/motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — Lessons at Netscribes" },
      {
        name: "description",
        content: "Your assigned learning at a glance: what's due soon, what's in progress, and pending actions.",
      },
      { property: "og:title", content: "Home — Lessons at Netscribes" },
      {
        property: "og:description",
        content: "Your assigned learning at a glance: what's due soon, what's in progress, and pending actions.",
      },
    ],
  }),
  component: HomePage,
});

const ORDER: ModuleCategory[] = ["mandatory", "onboarding", "team", "bank"];

function priority(m: LearningModule) {
  let score = 0;
  if (m.status === "overdue") score += 100;
  if (m.category === "mandatory") score += 50;
  if (m.status === "in-progress") score += 25;
  return score;
}

function HomePage() {
  const { data: user } = useQuery({ queryKey: ["current-user"], queryFn: getCurrentUser });
  const { data: modules, isPending } = useQuery({
    queryKey: ["modules"],
    queryFn: getAssignedModules,
  });
  const { data: actions = [] } = useQuery({
    queryKey: ["pending-actions"],
    queryFn: getPendingActions,
  });

  const all = modules ?? [];
  const continueRow = [...all]
    .filter((m) => m.status !== "complete")
    .sort((a, b) => priority(b) - priority(a) || a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  return (
    <PageFade className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-title">
          {user ? `Hello, ${user.name.split(" ")[0]}` : "Hello"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's where your learning stands today.
        </p>
      </header>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <ShimmerBlock key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : all.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="You're all caught up"
          description="Nothing is assigned to you right now. New modules will appear here as soon as they're published to your team."
        />
      ) : (
        <div className="space-y-10">
          {continueRow.length > 0 && (
            <section>
              <SectionHead title="Continue / Due soon" count={continueRow.length} />
              <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {continueRow.map((m) => (
                  <StaggerItem key={m.id}>
                    <ModuleCard module={m} />
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          )}

          {actions.length > 0 && (
            <section>
              <SectionHead title="Pending actions" count={actions.length} />
              <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {actions.map((a) => (
                  <StaggerItem
                    key={a.id}
                    className="surface card-hover flex items-start gap-3 p-3.5"
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                      {a.kind === "survey" ? (
                        <ClipboardList className="size-4 text-muted-foreground" strokeWidth={1.75} />
                      ) : (
                        <FileSignature className="size-4 text-muted-foreground" strokeWidth={1.75} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-[510]">{a.title}</p>
                      <p className="tnum text-xs text-muted-foreground">
                        {a.kind === "survey" ? "Survey" : "eSignature"} · due {formatDate(a.dueDate)}
                      </p>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          )}

          {ORDER.map((category) => {
            const list = all.filter((m) => m.category === category);
            if (list.length === 0) return null;
            return (
              <section key={category}>
                <SectionHead title={CATEGORY_LABEL[category]} count={list.length} />
                <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((m) => (
                    <StaggerItem key={m.id}>
                      <ModuleCard module={m} />
                    </StaggerItem>
                  ))}
                </Stagger>
              </section>
            );
          })}

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5" strokeWidth={1.75} />
            <Link to="/progress" className="hover:text-foreground">
              See your full standing
            </Link>
          </p>
        </div>
      )}
    </PageFade>
  );
}

function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-3 flex items-baseline gap-2">
      <h2 className="text-card-title">{title}</h2>
      <span className="tnum text-xs text-muted-foreground">{count}</span>
    </div>
  );
}
