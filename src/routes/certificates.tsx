import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Download,
  FileSignature,
  GraduationCap,
  Package,
  Search,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import { getCertificates, getCurrentUser, getPendingActions } from "@/data/repositories";
import type { Certificate } from "@/data/types";
import { formatDate } from "@/lib/format";
import { downloadText } from "@/lib/csv";
import { createZip, downloadBlob } from "@/lib/zip";
import { certificateFilename, certificateSvg } from "@/lib/certificate";
import { EmptyState } from "@/components/lessons/empty-state";
import { DoodlePanel } from "@/components/doodle-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });
  const { data: actions = [] } = useQuery({
    queryKey: ["pending-actions"],
    queryFn: getPendingActions,
  });

  const signatures = actions.filter((a) => a.kind === "esignature");
  const all = certs ?? [];
  const recipientName = currentUser?.name ?? "Netscribes Learner";
  const [query, setQuery] = useState("");
  const qq = query.trim().toLowerCase();
  const list = qq
    ? all.filter(
        (c) => c.title.toLowerCase().includes(qq) || c.credentialId.toLowerCase().includes(qq),
      )
    : all;

  // Earned vs the full set the learner is working toward (signatures still open
  // stand in for credentials not yet earned) — a simple "X of Y" standing.
  const target = all.length + signatures.length;
  const earned = all.length;

  const downloadOne = (cert: Certificate) => {
    downloadText(certificateFilename(cert), certificateSvg(cert, recipientName), "image/svg+xml");
  };

  const shareOne = async (cert: Certificate) => {
    const url = `${window.location.origin}/verify/${cert.credentialId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Verification link copied", { description: cert.credentialId });
    } catch {
      toast.info("Verification link", { description: url });
    }
  };

  const downloadAll = () => {
    if (list.length === 0) return;
    const zip = createZip(
      list.map((cert) => ({
        name: certificateFilename(cert),
        content: certificateSvg(cert, recipientName),
      })),
    );
    downloadBlob(`lessons-certificates-${new Date().toISOString().slice(0, 10)}.zip`, zip);
    toast.success(`Downloaded ${list.length} certificates`);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="page-header blue-wash mb-6">
        <DoodlePanel />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="size-6" strokeWidth={1.75} />
            </div>
            <h1 className="text-title">Certificates</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every credential you earn at Netscribes lands here — download or share it anytime.
            </p>
          </div>
          {earned > 0 && (
            <Button variant="secondary" size="sm" onClick={downloadAll} className="shrink-0">
              <Package className="size-4" strokeWidth={1.75} />
              Download all
            </Button>
          )}
        </div>

        {target > 0 && (
          <div className="relative mt-5 max-w-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Credentials earned</span>
              <span className="tnum font-[560] text-foreground">
                {earned} of {target}
              </span>
            </div>
            <Progress value={target ? (earned / target) * 100 : 0} className="mt-1.5 h-2" />
          </div>
        )}
      </header>

      {earned > 6 && (
        <div className="relative mb-4 max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search certificates"
            aria-label="Search certificates"
            className="h-9 pl-8"
          />
        </div>
      )}

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      ) : all.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Finish a module end to end and its certificate lands here automatically."
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No matches"
          description={`No certificate matches “${query}”.`}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <article key={c.id} className="surface card-hover animate-soft-in flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-status-complete/10 text-status-complete">
                  <Award className="size-5" strokeWidth={1.75} />
                </div>
                <span className="chip-blue rounded-full px-2.5 py-0.5 text-xs font-[510]">
                  Verified
                </span>
              </div>
              <h2 className="text-card-title">{c.title}</h2>
              <p className="tnum mt-1 text-xs text-muted-foreground">
                Issued {formatDate(c.issuedOn)}
              </p>
              <p className="tnum mt-0.5 text-xs text-muted-foreground">{c.credentialId}</p>
              <div className="mt-auto flex gap-2 pt-4">
                <Button size="sm" onClick={() => downloadOne(c)}>
                  <Download className="size-4" strokeWidth={1.75} />
                  Download
                </Button>
                <Button size="sm" variant="outline" onClick={() => void shareOne(c)}>
                  <Share2 className="size-4" strokeWidth={1.75} />
                  Share
                </Button>
              </div>
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
                <FileSignature
                  className="size-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.75}
                />
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
