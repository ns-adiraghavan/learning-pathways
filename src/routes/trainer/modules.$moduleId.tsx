import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, FileWarning } from "lucide-react";
import { toast } from "sonner";

import { getModuleDraft, saveModuleDraft } from "@/data/repositories";
import type { ModuleDraft } from "@/data/types";
import { AudienceTab } from "@/components/trainer/audience-tab";
import { ContentFlowTab } from "@/components/trainer/content-flow-tab";
import { SettingsTab } from "@/components/trainer/settings-tab";
import { StateBadge } from "@/components/trainer/state-badge";
import { PublishControl } from "@/components/trainer/publish-control";
import { EmptyState } from "@/components/lessons/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/trainer/modules/$moduleId")({
  head: () => ({
    meta: [
      { title: "Module editor — Lessons Trainer" },
      {
        name: "description",
        content: "Edit a module's content flow, settings, audience and analytics.",
      },
      { property: "og:title", content: "Module editor — Lessons Trainer" },
      {
        property: "og:description",
        content: "Edit a module's content flow, settings, audience and analytics.",
      },
    ],
  }),
  component: ModuleEditorPage,
});

function ModuleEditorPage() {
  const { moduleId } = Route.useParams();
  const { data, isPending } = useQuery({
    queryKey: ["module-draft", moduleId],
    queryFn: () => getModuleDraft(moduleId),
  });
  const [draft, setDraft] = useState<ModuleDraft | null>(null);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <EmptyState
          icon={FileWarning}
          title="Module not available"
          description="This draft doesn't exist yet, or no content is available."
        />
      </div>
    );
  }

  const save = async () => {
    await saveModuleDraft(draft);
    toast.success("Draft saved");
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/trainer/skills/$skillId"
        params={{ skillId: draft.skillId }}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={1.75} />
        {draft.skillTitle}
      </Link>

      <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <p className="text-label text-muted-foreground">
            {draft.programTitle} · {draft.skillTitle}
          </p>
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <h1 className="truncate text-title">{draft.title}</h1>
            <StateBadge state={draft.state} />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={save}>
            Save draft
          </Button>
          <PublishControl
            id={draft.id}
            state={draft.state}
            kind="module"
            invalidateKeys={[["module-draft", moduleId]]}
          />
        </div>
      </header>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content Flow</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="audience">Audience &amp; Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-5">
          <ContentFlowTab draft={draft} onChange={setDraft} />
        </TabsContent>
        <TabsContent value="settings" className="mt-5">
          <SettingsTab draft={draft} onChange={setDraft} />
        </TabsContent>
        <TabsContent value="audience" className="mt-5">
          <AudienceTab moduleId={draft.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
