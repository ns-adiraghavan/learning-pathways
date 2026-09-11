import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, FileSignature } from "lucide-react";

import { getCertificates, getPendingActions } from "@/data/repositories";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/lessons/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates — Lessons" },
      {
        name: "description",
        content: "Certificates you've earned at Netscribes and signatures still pending.",
      },
      { property: "og:title", content: "Certificates — Lessons" },
      {
        property: "og:description",
        content: "Certificates you've earned at Netscribes and signatures still pending.",
      },
    ],
  }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const { data: certs, isPending } = useQuery({
    queryKey: ["certificates"],
    queryFn: getCertificates,
  });
  const { data: actions = [] } = useQuery({
    queryKey: ["pending-actions"],
    queryFn: getPendingActions,
  });

  const signatures = actions.filter((a) => a.kind === "esignature");
  const list = certs ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-title">Certificates</h1>
        <p className="mt-1 text-sm text-muted-foreground">Earned credentials and open signatures.</p>
      </header>

      {isPending ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Finish a module end to end and its certificate lands here automatically."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((c) => (
            <article key={c.id} className="surface card-hover p-5">
              <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-status-complete/10">
                <Award className="size-4 text-status-complete" strokeWidth={1.75} />
              </div>
              <h2 className="text-card-title">{c.title}</h2>
              <p className="tnum mt-1 text-xs text-muted-foreground">
                Issued {formatDate(c.issuedOn)} · {c.credentialId}
              </p>
              <Button variant="outline" size="sm" className="mt-4">
                Download
              </Button>
            </article>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-card-title mb-3">Pending eSignatures</h2>
        {signatures.length === 0 ? (
          <EmptyState
            icon={FileSignature}
            title="Nothing to sign"
            description="Declarations and acknowledgements waiting on you will be listed here."
          />
        ) : (
          <ul className="surface overflow-hidden">
            {signatures.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
              >
                <FileSignature className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-[510]">{s.title}</p>
                  <p className="tnum text-xs text-muted-foreground">Due {formatDate(s.dueDate)}</p>
                </div>
                <Button size="sm" variant="outline">
                  Sign
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
