import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";

import {
  getCertificateTemplates,
  getPlatformSettings,
  savePlatformSettings,
} from "@/data/repositories";
import type { PlatformSettings } from "@/data/types";
import { EmptyState } from "@/components/lessons/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/customization")({
  head: () => ({
    meta: [
      { title: "Customization — Lessons Admin" },
      {
        name: "description",
        content: "Rename labels, manage banners, toggle notifications and set the certificate.",
      },
      { property: "og:title", content: "Customization — Lessons Admin" },
      {
        property: "og:description",
        content: "Rename labels, manage banners, toggle notifications and set the certificate.",
      },
    ],
  }),
  component: CustomizationPage,
});

function CustomizationPage() {
  const { data, isPending } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: getPlatformSettings,
  });
  const { data: templates = [] } = useQuery({
    queryKey: ["certificate-templates"],
    queryFn: getCertificateTemplates,
  });
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    if (data) setSettings(data);
  }, [data]);

  if (isPending || !settings) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const save = async () => {
    await savePlatformSettings(settings);
    toast.success("Settings saved");
  };

  const term = settings.terminology;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-title">Customization</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Light touches only — wording, banners, notifications and the default certificate.
          </p>
        </div>
        <Button size="sm" onClick={save}>
          Save changes
        </Button>
      </header>

      <div className="grid gap-6">
        <section className="surface p-4 sm:p-5">
          <h2 className="text-card-title">Terminology</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Rename what things are called across the platform.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["programLabel", "Program"],
                ["skillLabel", "Skill"],
                ["moduleLabel", "Module"],
                ["learnerLabel", "Learner"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={term[key]}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      terminology: { ...term, [key]: e.target.value },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </section>

        <section className="surface p-4 sm:p-5">
          <h2 className="text-card-title">Banners</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Short announcements shown on the learner home page.
          </p>
          {settings.banners.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Megaphone}
                title="No banners"
                description="Add a banner to announce something across the platform."
              />
            </div>
          ) : (
            <ul className="mt-4 grid gap-2">
              {settings.banners.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-[510]">{b.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{b.audience}</p>
                  </div>
                  <Switch
                    checked={b.active}
                    aria-label={`Show ${b.title}`}
                    onCheckedChange={(v) =>
                      setSettings({
                        ...settings,
                        banners: settings.banners.map((x) =>
                          x.id === b.id ? { ...x, active: v } : x,
                        ),
                      })
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-4 sm:p-5">
          <h2 className="text-card-title">Notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose which emails and in-app nudges Lessons sends.
          </p>
          <ul className="mt-4 grid gap-2">
            {settings.notifications.map((n) => (
              <li
                key={n.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
              >
                <span className="text-sm">{n.label}</span>
                <Switch
                  checked={n.enabled}
                  aria-label={n.label}
                  onCheckedChange={(v) =>
                    setSettings({
                      ...settings,
                      notifications: settings.notifications.map((x) =>
                        x.id === n.id ? { ...x, enabled: v } : x,
                      ),
                    })
                  }
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="surface p-4 sm:p-5">
          <h2 className="text-card-title">Default certificate</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Used when a module does not pick its own pre-built template.
          </p>
          <div className="mt-4 max-w-sm">
            <Select
              {...(settings.defaultCertificateTemplateId
                ? { value: settings.defaultCertificateTemplateId }
                : {})}
              onValueChange={(v) => setSettings({ ...settings, defaultCertificateTemplateId: v })}
            >
              <SelectTrigger aria-label="Default certificate template">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>
      </div>
    </div>
  );
}
