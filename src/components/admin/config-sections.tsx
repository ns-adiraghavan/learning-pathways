import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getEnrollmentRules,
  getNotificationSettings,
  getPointsRules,
  saveEnrollmentRules,
  saveNotificationSettings,
  savePointsRules,
} from "@/data/repositories";
import { Plus, Trash2 } from "lucide-react";

import type { EnrollmentRule, NotifChannel, NotificationSetting, PointsRule } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Org attributes an enrollment rule can key on. */
const RULE_ATTRIBUTES = [
  "Department",
  "Employee type",
  "Location",
  "Function",
  "Division",
  "Grade",
  "Designation",
];

const CHANNELS: { key: NotifChannel; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "inApp", label: "In-app" },
  { key: "push", label: "Push" },
];

/** (Pointer 15) Per-event channel matrix. Delivery infra is backend-owned. */
export function NotificationMatrixSection() {
  const { data } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: getNotificationSettings,
  });
  const [rows, setRows] = useState<NotificationSetting[] | null>(null);
  useEffect(() => {
    if (data) setRows(data);
  }, [data]);
  if (!rows) return null;

  const toggle = (id: string, channel: NotifChannel, on: boolean) =>
    setRows((prev) =>
      prev!.map((r) => (r.id === id ? { ...r, channels: { ...r.channels, [channel]: on } } : r)),
    );

  return (
    <section className="surface p-4 sm:p-5">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h2 className="text-card-title">Notifications</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            void saveNotificationSettings(rows).then(() =>
              toast.success("Notification settings saved"),
            )
          }
        >
          Save
        </Button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Choose how each event reaches learners. Sending is handled by the delivery service.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-[510]">Event</th>
              {CHANNELS.map((c) => (
                <th key={c.key} className="px-3 py-2 text-center font-[510]">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-4">
                  <p className="font-[510]">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </td>
                {CHANNELS.map((c) => (
                  <td key={c.key} className="px-3 py-2.5 text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={r.channels[c.key]}
                        aria-label={`${r.label} — ${c.label}`}
                        onCheckedChange={(v) => toggle(r.id, c.key, v)}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** (Pointer 14) Enrollment trigger rules — add, edit, enable, remove. Engine is backend-owned. */
export function EnrollmentRulesSection() {
  const { data } = useQuery({ queryKey: ["enrollment-rules"], queryFn: getEnrollmentRules });
  const [rules, setRules] = useState<EnrollmentRule[] | null>(null);
  useEffect(() => {
    if (data) setRules(data);
  }, [data]);
  if (!rules) return null;

  const patch = (id: string, updates: Partial<EnrollmentRule>) =>
    setRules((prev) => prev!.map((x) => (x.id === id ? { ...x, ...updates } : x)));

  const addRule = () =>
    setRules((prev) => [
      ...prev!,
      {
        id: `er-new-${Date.now()}`,
        attribute: "Department",
        value: "",
        moduleTitle: "",
        enabled: true,
      },
    ]);

  const removeRule = (id: string) => setRules((prev) => prev!.filter((x) => x.id !== id));

  const incomplete = rules.some((r) => !r.value.trim() || !r.moduleTitle.trim());

  return (
    <section className="surface p-4 sm:p-5">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h2 className="text-card-title">Enrollment rules</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={addRule}>
            <Plus className="size-4" strokeWidth={2} />
            Add rule
          </Button>
          <Button
            size="sm"
            disabled={incomplete}
            onClick={() =>
              void saveEnrollmentRules(rules).then(() => toast.success("Enrollment rules saved"))
            }
          >
            Save
          </Button>
        </div>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Auto-enroll matching learners into a module. Set the attribute, the value to match, and the
        module to enroll into. The enrollment engine applies these on join.
      </p>

      {rules.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          No rules yet. Add one to auto-enroll matching learners.
        </p>
      ) : (
        <ul className="grid gap-2">
          {rules.map((r) => (
            <li
              key={r.id}
              className="grid items-center gap-2 rounded-md border border-border px-3 py-2.5 sm:grid-cols-[minmax(140px,1fr)_minmax(120px,1fr)_minmax(160px,1.4fr)_auto_auto]"
            >
              <Select value={r.attribute} onValueChange={(v) => patch(r.id, { attribute: v })}>
                <SelectTrigger className="h-9" aria-label="Attribute">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_ATTRIBUTES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={r.value}
                onChange={(e) => patch(r.id, { value: e.target.value })}
                placeholder="is… e.g. Research"
                aria-label="Value to match"
                className="h-9"
              />
              <Input
                value={r.moduleTitle}
                onChange={(e) => patch(r.id, { moduleTitle: e.target.value })}
                placeholder="→ enroll in module"
                aria-label="Module to enroll into"
                className="h-9"
              />
              <div className="flex items-center justify-center">
                <Switch
                  checked={r.enabled}
                  aria-label={`Enable ${r.attribute} rule`}
                  onCheckedChange={(v) => patch(r.id, { enabled: v })}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Remove rule"
                onClick={() => removeRule(r.id)}
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** (Pointer 16) Gamification points config. The points engine awards them. */
export function PointsRulesSection() {
  const { data } = useQuery({ queryKey: ["points-rules"], queryFn: getPointsRules });
  const [rules, setRules] = useState<PointsRule[] | null>(null);
  useEffect(() => {
    if (data) setRules(data);
  }, [data]);
  if (!rules) return null;

  const setField = (id: string, key: "points" | "perModuleCap", value: number) =>
    setRules((prev) => prev!.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  return (
    <section className="surface p-4 sm:p-5">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h2 className="text-card-title">Points rules</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            void savePointsRules(rules).then(() => toast.success("Points rules saved"))
          }
        >
          Save
        </Button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Set points per event and a per-module cap. The points engine enforces them.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-[510]">Event</th>
              <th className="px-3 py-2 font-[510]">Points</th>
              <th className="px-3 py-2 font-[510]">Per-module cap</th>
              <th className="px-3 py-2 text-center font-[510]">On</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-4 font-[510]">{r.event}</td>
                <td className="px-3 py-2.5">
                  <Input
                    type="number"
                    value={r.points}
                    onChange={(e) => setField(r.id, "points", Number(e.target.value))}
                    className="tnum h-8 w-20"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <Input
                    type="number"
                    value={r.perModuleCap}
                    onChange={(e) => setField(r.id, "perModuleCap", Number(e.target.value))}
                    className="tnum h-8 w-20"
                  />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center">
                    <Switch
                      checked={r.enabled}
                      aria-label={`Enable ${r.event}`}
                      onCheckedChange={(v) =>
                        setRules((prev) =>
                          prev!.map((x) => (x.id === r.id ? { ...x, enabled: v } : x)),
                        )
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
