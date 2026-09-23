import type { DueMode, ModuleDraft, PushEnrollment, SelfEnrollment } from "@/data/types";
import { DIVISIONS } from "@/data/org";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export function SettingsTab({
  draft,
  onChange,
}: {
  draft: ModuleDraft;
  onChange: (next: ModuleDraft) => void;
}) {
  const s = draft.settings;
  const set = (patch: Partial<typeof s>) => onChange({ ...draft, settings: { ...s, ...patch } });

  const toggleTeam = (team: string) =>
    set({
      accessTeams: s.accessTeams.includes(team)
        ? s.accessTeams.filter((t) => t !== team)
        : [...s.accessTeams, team],
    });

  const accessSummary =
    s.visibility === "everyone"
      ? "Everyone in the org can see this module once it's published."
      : s.visibility === "audience"
        ? `Visible to the target audience${s.targetAudience ? ` (${s.targetAudience})` : ""}.`
        : s.accessTeams.length > 0
          ? `Visible to ${s.accessTeams.length} team${s.accessTeams.length === 1 ? "" : "s"}: ${s.accessTeams.join(", ")}.`
          : "Restricted — pick at least one team below.";

  return (
    <div className="grid gap-6">
      {/* Visibility & access — who can see it, who cannot, who has access */}
      <section className="surface p-4 sm:p-5">
        <h2 className="text-card-title">Visibility &amp; access</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Control who can see this module and who is kept out.
        </p>

        <RadioGroup
          className="mt-4 grid gap-3 sm:grid-cols-3"
          value={s.visibility}
          onValueChange={(v) => set({ visibility: v as ModuleDraft["settings"]["visibility"] })}
        >
          <VisibilityChoice
            id="vis-everyone"
            value="everyone"
            active={s.visibility === "everyone"}
            title="Everyone"
            desc="Anyone in the org can find it."
          />
          <VisibilityChoice
            id="vis-audience"
            value="audience"
            active={s.visibility === "audience"}
            title="Target audience"
            desc="Only the audience set below."
          />
          <VisibilityChoice
            id="vis-restricted"
            value="restricted"
            active={s.visibility === "restricted"}
            title="Restricted"
            desc="Only the teams you pick."
          />
        </RadioGroup>

        {s.visibility === "audience" && (
          <div className="mt-3 grid gap-1.5">
            <Label htmlFor="vis-audience-text">Who can see it (audience)</Label>
            <Input
              id="vis-audience-text"
              value={s.targetAudience}
              onChange={(e) => set({ targetAudience: e.target.value })}
              placeholder="e.g. All delivery teams"
            />
          </div>
        )}

        {s.visibility === "restricted" && (
          <div className="mt-3">
            <Label className="text-xs text-muted-foreground">Teams with access</Label>
            <div className="mt-2 grid max-h-56 grid-cols-2 gap-x-4 gap-y-2 overflow-y-auto rounded-lg border border-border p-3 sm:grid-cols-3">
              {DIVISIONS.map((team) => (
                <label
                  key={team}
                  className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                >
                  <Checkbox
                    checked={s.accessTeams.includes(team)}
                    onCheckedChange={() => toggleTeam(team)}
                    aria-label={team}
                  />
                  <span className="truncate">{team}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 grid gap-1.5">
          <Label htmlFor="excluded">Excluded people or teams</Label>
          <Input
            id="excluded"
            value={s.excluded.join(", ")}
            onChange={(e) =>
              set({
                excluded: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            placeholder="e.g. Interns, Contractors, jane.doe@netscribes.com"
          />
          <p className="text-xs text-muted-foreground">
            These are hidden from the module even if they otherwise qualify.
          </p>
        </div>

        <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          {accessSummary}
          {s.excluded.length > 0 && ` Excluded: ${s.excluded.join(", ")}.`}
        </p>
      </section>
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
              set({
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="keywords">Search keywords</Label>
          <Input
            id="keywords"
            value={s.keywords.join(", ")}
            onChange={(e) =>
              set({
                keywords: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
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

function VisibilityChoice({
  id,
  value,
  active,
  title,
  desc,
}: {
  id: string;
  value: string;
  active: boolean;
  title: string;
  desc: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm",
        active ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <RadioGroupItem value={value} id={id} className="mt-0.5" />
      <span>
        <span className="block font-[510]">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </label>
  );
}
