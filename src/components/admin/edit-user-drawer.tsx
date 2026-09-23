import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateUser } from "@/data/repositories";
import type { AdminUser, EmployeeType, OrgEntity, UserStatus } from "@/data/types";
import {
  DEPARTMENTS,
  DESIGNATIONS,
  EMPLOYEE_TYPES,
  ENTITIES_LIST,
  FUNCTIONS,
  GRADES,
  LOCATIONS,
  PROJECTS,
} from "@/data/admin-mocks";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
const STATUSES: UserStatus[] = ["active", "invited", "inactive"];
const ROLES: AdminUser["role"][] = ["Learner", "Trainer", "Administrator"];

type Draft = Pick<
  AdminUser,
  | "name"
  | "email"
  | "mobileNumber"
  | "team"
  | "department"
  | "location"
  | "designation"
  | "employeeType"
  | "functionArea"
  | "grade"
  | "manager"
  | "userStatus"
  | "role"
  | "entity"
  | "projectName"
>;

function toDraft(u: AdminUser): Draft {
  return {
    name: u.name,
    email: u.email,
    mobileNumber: u.mobileNumber,
    team: u.team,
    department: u.department,
    location: u.location,
    designation: u.designation,
    employeeType: u.employeeType,
    functionArea: u.functionArea,
    grade: u.grade,
    manager: u.manager,
    userStatus: u.userStatus,
    role: u.role,
    entity: u.entity,
    projectName: u.projectName,
  };
}

/**
 * Slide-in editor for a single learner (pointer 13/19). Save calls updateUser();
 * "Login as" is a support-impersonation placeholder — the real session-assumption
 * + audit trail is a backend concern (see technical reference).
 */
export function EditUserDrawer({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    setDraft(user ? toDraft(user) : null);
  }, [user]);

  const mutation = useMutation({
    mutationFn: () => updateUser(user!.id, draft as Partial<AdminUser>),
    onSuccess: (updated) => {
      toast.success(`${updated?.name ?? "User"} updated`);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-user", user?.id] });
      onClose();
    },
  });

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <Sheet open={!!user} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Edit user</SheetTitle>
          <SheetDescription>
            {user?.userId} · changes save to the directory record.
          </SheetDescription>
        </SheetHeader>

        {draft && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="grid gap-3.5">
              <Field label="Full name">
                <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Work email">
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Mobile number">
                <Input
                  value={draft.mobileNumber}
                  onChange={(e) => set("mobileNumber", e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <PickOne
                    value={draft.userStatus}
                    onChange={(v) => set("userStatus", v as UserStatus)}
                    options={STATUSES}
                  />
                </Field>
                <Field label="Role">
                  <PickOne
                    value={draft.role}
                    onChange={(v) => set("role", v as AdminUser["role"])}
                    options={ROLES}
                  />
                </Field>
              </div>

              <Field label="Team">
                <Input value={draft.team} onChange={(e) => set("team", e.target.value)} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Department">
                  <PickOne
                    value={draft.department}
                    onChange={(v) => set("department", v)}
                    options={DEPARTMENTS}
                  />
                </Field>
                <Field label="Location">
                  <PickOne
                    value={draft.location}
                    onChange={(v) => set("location", v)}
                    options={LOCATIONS}
                  />
                </Field>
                <Field label="Designation">
                  <PickOne
                    value={draft.designation}
                    onChange={(v) => set("designation", v)}
                    options={DESIGNATIONS}
                  />
                </Field>
                <Field label="Employee type">
                  <PickOne
                    value={draft.employeeType}
                    onChange={(v) => set("employeeType", v as EmployeeType)}
                    options={EMPLOYEE_TYPES}
                  />
                </Field>
                <Field label="Function">
                  <PickOne
                    value={draft.functionArea}
                    onChange={(v) => set("functionArea", v)}
                    options={FUNCTIONS}
                  />
                </Field>
                <Field label="Grade">
                  <PickOne value={draft.grade} onChange={(v) => set("grade", v)} options={GRADES} />
                </Field>
                <Field label="Entity">
                  <PickOne
                    value={draft.entity}
                    onChange={(v) => set("entity", v as OrgEntity)}
                    options={ENTITIES_LIST}
                  />
                </Field>
                <Field label="Project">
                  <PickOne
                    value={draft.projectName}
                    onChange={(v) => set("projectName", v)}
                    options={PROJECTS}
                  />
                </Field>
              </div>

              <Field label="Manager">
                <Input value={draft.manager} onChange={(e) => set("manager", e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        <SheetFooter className="flex-row items-center gap-2 border-t border-border">
          <Button variant="outline" size="sm" className="ml-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!draft?.name || !draft?.email || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function PickOne({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="capitalize">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
