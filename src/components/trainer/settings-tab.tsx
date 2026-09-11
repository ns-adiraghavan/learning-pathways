import type { DueMode, ModuleDraft, PushEnrollment, SelfEnrollment } from "@/data/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function SettingsTab({
  draft,
  onChange,
}: {
  draft: ModuleDraft;
  onChange: (next: ModuleDraft) => void;
}) {
  const s = draft.settings;
  const set = (patch: Partial<typeof s>) => onChange({ ...draft, settings: { ...s, ...patch } });

  return (
    <div className="grid gap-6">
      <section className="surface p-4 sm:p-5">
        <h2 className="text-card-title">Push enrollment</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Who gets this assigned to them.</p>
        <RadioGroup
          className="mt-4 grid gap-3"
          value={s.pushEnrollment}
          onValueChange={(v) => set({ pushEnrollment: v as PushEnrollment })}
        >
          <Choice value="all-skill" label="Everyone on this skill" id="pe-1" />
          <Choice value="audience" label="A target audience" id="pe-2" />
          <Choice value="manual" label="Select manually at publish" id="pe-3" />
        </RadioGroup>
        {s.pushEnrollment === "audience" && (
          <div className="mt-3 grid gap-1.5">
            <Label htmlFor="audience">Target audience</Label>
            <Input
              id="audience"
              value={s.targetAudience}
              onChange={(e) => set({ targetAudience: e.target.value })}
            />
          </div>
        )}
      </section>

      <section className="surface p-4 sm:p-5">
        <h2 className="text-card-title">Self enrollment</h2>
        <RadioGroup
          className="mt-4 grid gap-3"
          value={s.selfEnrollment}
          onValueChange={(v) => set({ selfEnrollment: v as SelfEnrollment })}
        >
          <Choice value="block" label="Block self enrollment" id="se-1" />
          <Choice value="any" label="Allow anyone to enroll" id="se-2" />
          <Choice value="criteria" label="Allow if criteria are met" id="se-3" />
        </RadioGroup>
        {s.selfEnrollment === "criteria" && (
          <div className="mt-3 grid gap-1.5">
            <Label htmlFor="criteria">Criteria</Label>
            <Input
              id="criteria"
              value={s.criteria}
              onChange={(e) => set({ criteria: e.target.value })}
            />
          </div>
        )}
      </section>

      <section className="surface p-4 sm:p-5">
        <h2 className="text-card-title">Due date</h2>
        <RadioGroup
          className="mt-4 grid gap-3"
          value={s.dueMode}
          onValueChange={(v) => set({ dueMode: v as DueMode })}
        >
          <Choice value="fixed" label="A fixed calendar date" id="dd-1" />
          <Choice value="relative" label="Within N days of joining" id="dd-2" />
        </RadioGroup>
        <div className="mt-3 max-w-xs">
          {s.dueMode === "fixed" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="due">Due on</Label>
              <Input
                id="due"
                type="date"
                value={s.dueDate}
                onChange={(e) => set({ dueDate: e.target.value })}
              />
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Label htmlFor="days">Days after joining</Label>
              <Input
                id="days"
                type="number"
                min={1}
                className="tnum"
                value={s.dueWithinDays}
                onChange={(e) => set({ dueWithinDays: Number(e.target.value) })}
              />
            </div>
          )}
        </div>
      </section>

      <section className="surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-card-title">Require eSignature</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Learners sign an acknowledgement after completing.
            </p>
          </div>
          <Switch
            checked={s.esignature}
            onCheckedChange={(v) => set({ esignature: v })}
            aria-label="Require eSignature"
          />
        </div>
      </section>

      <section className="surface grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
        <div className="grid gap-1.5">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={s.tags.join(", ")}
            onChange={(e) =>
              set({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="keywords">Search keywords</Label>
          <Input
            id="keywords"
            value={s.keywords.join(", ")}
            onChange={(e) =>
              set({ keywords: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="points">Leaderboard points</Label>
          <Input
            id="points"
            type="number"
            min={0}
            className="tnum"
            value={s.leaderboardPoints}
            onChange={(e) => set({ leaderboardPoints: Number(e.target.value) })}
          />
        </div>
      </section>
    </div>
  );
}

function Choice({ value, label, id }: { value: string; label: string; id: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <RadioGroupItem value={value} id={id} />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  );
}
