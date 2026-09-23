import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Eye,
  LogIn,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  SlidersHorizontal,
  Send,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { downloadCsv, toCsv } from "@/lib/csv";
import { datedCsvFilename } from "@/components/download-csv-button";
import { addUser, getUser, getUserProgress, getUsers, updateUser } from "@/data/repositories";
import type { AdminRole, AdminUser, UserFilters } from "@/data/types";
import { EmptyState } from "@/components/lessons/empty-state";
import { EditUserDrawer } from "@/components/admin/edit-user-drawer";
import { ImportUsersDialog } from "@/components/admin/import-users-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBox } from "@/components/ui/search-box";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isNewJoiner, STATUS_DOT, STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users & Progress — Lessons Admin" },
      {
        name: "description",
        content: "Search Netscribes learners and review each person's module progress.",
      },
      { property: "og:title", content: "Users & Progress — Lessons Admin" },
      {
        property: "og:description",
        content: "Search Netscribes learners and review each person's module progress.",
      },
    ],
  }),
  component: UsersPage,
});

const EMPLOYEE_TYPE_OPTIONS = ["full-time", "contract", "intern"] as const;

const EXPORT_HEADERS = [
  "User ID",
  "Name",
  "Email",
  "Status",
  "Entity",
  "Team",
  "Department",
  "Location",
  "Project",
  "Designation",
  "Employee type",
  "Function",
  "Grade",
  "Manager",
  "Joining date",
  "Assigned",
  "Complete",
];

function toExportRow(u: AdminUser): (string | number)[] {
  return [
    u.userId,
    u.name,
    u.email,
    u.userStatus,
    u.entity,
    u.team,
    u.department,
    u.location,
    u.projectName,
    u.designation,
    u.employeeType,
    u.functionArea,
    u.grade,
    u.manager,
    u.joiningDate,
    u.assignedCount,
    u.completeCount,
  ];
}

const EMPTY_FILTERS: UserFilters = {
  q: "",
  status: "all",
  team: "all",
  department: "all",
  location: "all",
  employeeType: "all",
  functionArea: "all",
  grade: "all",
  role: "all",
  entity: "all",
  projectName: "all",
};

function UsersPage() {
  const [filters, setFilters] = useState<UserFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [progressUserId, setProgressUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [browseAll, setBrowseAll] = useState(false);

  // Full unfiltered set — used to build the slicer option lists (facets).
  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin-users", "facets"],
    queryFn: () => getUsers(),
  });

  const { data: users = [], isPending } = useQuery({
    queryKey: ["admin-users", filters],
    queryFn: () => getUsers("", filters),
  });

  const facet = useMemo(() => {
    const uniq = (get: (u: AdminUser) => string) =>
      Array.from(new Set(allUsers.map(get)))
        .filter(Boolean)
        .sort();
    return {
      team: uniq((u) => u.team),
      department: uniq((u) => u.department),
      location: uniq((u) => u.location),
      functionArea: uniq((u) => u.functionArea),
      grade: uniq((u) => u.grade),
      entity: uniq((u) => u.entity),
      projectName: uniq((u) => u.projectName),
    };
  }, [allUsers]);

  const activeCount = useMemo(
    () =>
      Object.entries(filters).filter(([key, value]) => key !== "q" && value && value !== "all")
        .length,
    [filters],
  );

  const set = <K extends keyof UserFilters>(key: K, value: UserFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelected([]);
  };

  // With ~700 people, don't dump the whole directory by default — lead with a
  // team rollup and only render the full list once the admin searches, filters,
  // or explicitly opts to browse everyone.
  const hasCriteria = Boolean((filters.q ?? "").trim()) || activeCount > 0;
  const showTable = hasCriteria || browseAll;

  const teamRollup = useMemo(() => {
    const map = new Map<
      string,
      { team: string; count: number; active: number; assigned: number; complete: number }
    >();
    allUsers.forEach((u) => {
      const cur = map.get(u.team) ?? {
        team: u.team,
        count: 0,
        active: 0,
        assigned: 0,
        complete: 0,
      };
      cur.count += 1;
      if (u.userStatus === "active") cur.active += 1;
      cur.assigned += u.assignedCount;
      cur.complete += u.completeCount;
      map.set(u.team, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allUsers]);

  const selectedRows = users.filter((u) => selected.includes(u.id));
  const allChecked = users.length > 0 && users.every((u) => selected.includes(u.id));

  const exportRows = (list: AdminUser[], slug: string) => {
    if (list.length === 0) {
      toast.info("Nothing to export for this selection");
      return;
    }
    downloadCsv(datedCsvFilename(slug), toCsv(EXPORT_HEADERS, list.map(toExportRow)));
    toast.success(`Exported ${list.length} users`);
  };

  const queryClient = useQueryClient();
  const setStatus = (u: AdminUser, status: AdminUser["userStatus"]) => {
    void updateUser(u.id, { userStatus: status }).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(status === "inactive" ? `${u.name} deactivated` : `${u.name} reactivated`);
    });
  };

  const runBulk = (action: "remind" | "unenroll" | "reset") => {
    // Our slice is the control; delivery/unenrollment engine is backend-owned.
    const verb =
      action === "remind" ? "Reminder queued for" : action === "unenroll" ? "Unenrolled" : "Reset";
    toast.success(`${verb} ${selected.length} ${selected.length === 1 ? "user" : "users"}`);
    setSelected([]);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-title">Users &amp; Progress</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            People are auto-provisioned from HR. Search, slice, and manage the directory here.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast.success("Sync queued — pulling the latest roster from Coefficient")
            }
          >
            <RefreshCw className="size-4" strokeWidth={1.75} />
            Sync from Coefficient
          </Button>
          <ImportUsersDialog />
          <AddUserDialog />
        </div>
      </header>

      {/* Search + slicer toggle */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox
          value={filters.q ?? ""}
          onChange={(v) => set("q", v)}
          placeholder="Search name, user ID or email"
          ariaLabel="Search users"
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Button
          size="sm"
          variant={showFilters ? "secondary" : "outline"}
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="size-4" strokeWidth={1.75} />
          Filters
          {activeCount > 0 && (
            <span className="tnum ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => exportRows(users, "admin-users")}
          disabled={users.length === 0}
        >
          <Download className="size-4" strokeWidth={1.75} />
          Export
          <span className="hidden sm:inline">
            &nbsp;{activeCount > 0 || filters.q ? "filtered" : "all"}
          </span>
        </Button>
      </div>

      {/* Multi-field slicer panel (pointer 10) */}
      {showFilters && (
        <section className="sky-panel animate-soft-in mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Slicer
            label="Status"
            value={filters.status ?? "all"}
            onChange={(v) => set("status", v as UserFilters["status"])}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "invited", label: "Invited" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <Slicer
            label="Role"
            value={filters.role ?? "all"}
            onChange={(v) => set("role", v as UserFilters["role"])}
            options={[
              { value: "all", label: "All roles" },
              { value: "Learner", label: "Learner" },
              { value: "Trainer", label: "Trainer" },
              { value: "Administrator", label: "Administrator" },
            ]}
          />
          <Slicer
            label="Team"
            value={filters.team ?? "all"}
            onChange={(v) => set("team", v)}
            options={facetOptions("All teams", facet.team)}
          />
          <Slicer
            label="Department"
            value={filters.department ?? "all"}
            onChange={(v) => set("department", v)}
            options={facetOptions("All departments", facet.department)}
          />
          <Slicer
            label="Location"
            value={filters.location ?? "all"}
            onChange={(v) => set("location", v)}
            options={facetOptions("All locations", facet.location)}
          />
          <Slicer
            label="Employee type"
            value={filters.employeeType ?? "all"}
            onChange={(v) => set("employeeType", v as UserFilters["employeeType"])}
            options={[
              { value: "all", label: "All types" },
              ...EMPLOYEE_TYPE_OPTIONS.map((t) => ({ value: t, label: t })),
            ]}
          />
          <Slicer
            label="Function"
            value={filters.functionArea ?? "all"}
            onChange={(v) => set("functionArea", v)}
            options={facetOptions("All functions", facet.functionArea)}
          />
          <Slicer
            label="Grade"
            value={filters.grade ?? "all"}
            onChange={(v) => set("grade", v)}
            options={facetOptions("All grades", facet.grade)}
          />
          <Slicer
            label="Entity"
            value={filters.entity ?? "all"}
            onChange={(v) => set("entity", v as UserFilters["entity"])}
            options={facetOptions("All entities", facet.entity)}
          />
          <Slicer
            label="Project"
            value={filters.projectName ?? "all"}
            onChange={(v) => set("projectName", v)}
            options={facetOptions("All projects", facet.projectName)}
          />
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setSelected([]);
                setBrowseAll(false);
              }}
              disabled={activeCount === 0 && !filters.q}
            >
              <X className="size-4" strokeWidth={1.75} />
              Clear all
            </Button>
          </div>
        </section>
      )}

      {!showTable ? (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              <span className="tnum font-[590] text-foreground">{allUsers.length}</span> people
              across {teamRollup.length} teams — search, filter, or open a team to drill in.
            </p>
            <Button size="sm" variant="outline" onClick={() => setBrowseAll(true)}>
              Browse all users
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teamRollup.map((t) => {
              const pct = t.assigned ? Math.round((t.complete / t.assigned) * 100) : 0;
              return (
                <button
                  key={t.team}
                  type="button"
                  onClick={() => {
                    setShowFilters(true);
                    set("team", t.team);
                  }}
                  className="surface card-hover p-4 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-card-title truncate">{t.team}</h3>
                    <span className="tnum shrink-0 text-sm font-[590]">{t.count}</span>
                  </div>
                  <p className="tnum mt-0.5 text-xs text-muted-foreground">{t.active} active</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                  <p className="tnum mt-1.5 text-xs text-muted-foreground">
                    {pct}% modules complete
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      ) : isPending ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Nobody matches these filters. Clear them, import a list, or add a user manually."
        />
      ) : (
        <section className="surface overflow-hidden">
          {/* Bulk action bar */}
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-3 py-2.5">
              <span className="tnum text-sm font-[510]">{selected.length} selected</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => runBulk("remind")}>
                  <Send className="size-3.5" strokeWidth={1.75} />
                  Send reminder
                </Button>
                <Button size="sm" variant="outline" onClick={() => runBulk("reset")}>
                  Reset progress
                </Button>
                <Button size="sm" variant="outline" onClick={() => runBulk("unenroll")}>
                  Unenroll
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => exportRows(selectedRows, "admin-users-selected")}
                >
                  <Download className="size-3.5" strokeWidth={1.75} />
                  Export selected
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allChecked}
                      aria-label="Select all"
                      onCheckedChange={(v) => setSelected(v === true ? users.map((u) => u.id) : [])}
                    />
                  </TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead className="hidden md:table-cell">User ID</TableHead>
                  <TableHead className="hidden lg:table-cell">User Email</TableHead>
                  <TableHead className="tnum hidden xl:table-cell">Created On</TableHead>
                  <TableHead className="hidden 2xl:table-cell">Allowed Views</TableHead>
                  <TableHead>User Status</TableHead>
                  <TableHead className="tnum hidden xl:table-cell">Mobile Number</TableHead>
                  <TableHead className="hidden lg:table-cell">Department</TableHead>
                  <TableHead className="hidden md:table-cell">Entity</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    data-state={selected.includes(u.id) ? "selected" : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(u.id)}
                        aria-label={`Select ${u.name}`}
                        onCheckedChange={(v) =>
                          setSelected((prev) =>
                            v === true ? [...prev, u.id] : prev.filter((id) => id !== u.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setProgressUserId(u.id)}
                          className={cn(
                            "max-w-[200px] truncate text-left text-sm font-[510] hover:text-primary",
                            u.userStatus === "inactive" && "text-muted-foreground line-through",
                          )}
                        >
                          {u.name}
                        </button>
                        {isNewJoiner(u.joiningDate) && (
                          <span className="shrink-0 rounded-[4px] bg-cat-onboarding/12 px-1.5 py-0.5 text-[10px] font-[590] text-cat-onboarding">
                            New joiner
                          </span>
                        )}
                      </span>
                      <span className="block max-w-[220px] truncate text-xs text-muted-foreground lg:hidden">
                        {u.email}
                      </span>
                    </TableCell>
                    <TableCell className="tnum hidden text-sm text-muted-foreground md:table-cell">
                      {u.userId}
                    </TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-sm text-muted-foreground lg:table-cell">
                      {u.email}
                    </TableCell>
                    <TableCell className="tnum hidden text-sm text-muted-foreground xl:table-cell">
                      {u.createdOn}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground capitalize 2xl:table-cell">
                      {u.allowedViews.join(", ")}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            u.userStatus === "active"
                              ? "bg-status-complete"
                              : u.userStatus === "invited"
                                ? "bg-status-progress"
                                : "bg-muted-foreground",
                          )}
                        />
                        {u.userStatus}
                      </span>
                    </TableCell>
                    <TableCell className="tnum hidden text-sm text-muted-foreground xl:table-cell">
                      {u.mobileNumber}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {u.department}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-[590]",
                          u.entity === "NAPL"
                            ? "bg-cat-team/12 text-cat-team"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {u.entity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Actions for ${u.name}`}
                          >
                            <MoreHorizontal className="size-4" strokeWidth={1.75} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditUser(u)}>
                            <Pencil className="size-4" strokeWidth={1.75} />
                            Edit details
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setProgressUserId(u.id)}>
                            <Eye className="size-4" strokeWidth={1.75} />
                            View progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => toast.success(`Reminder queued for ${u.name}`)}
                          >
                            <Send className="size-4" strokeWidth={1.75} />
                            Send reminder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() =>
                              toast.info(`Impersonation stub — would open a session as ${u.name}`)
                            }
                          >
                            <LogIn className="size-4" strokeWidth={1.75} />
                            Login as
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {u.userStatus === "inactive" ? (
                            <DropdownMenuItem onSelect={() => setStatus(u, "active")}>
                              <UserCheck className="size-4" strokeWidth={1.75} />
                              Reactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => setStatus(u, "inactive")}
                            >
                              <UserX className="size-4" strokeWidth={1.75} />
                              Deactivate (left company)
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <span className="tnum text-xs text-muted-foreground">
              Showing {users.length} of {allUsers.length} users
            </span>
            <button
              type="button"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setBrowseAll(false);
                setSelected([]);
              }}
              className="text-xs font-[510] text-primary hover:underline"
            >
              Back to team summary
            </button>
          </div>
        </section>
      )}

      <UserPanel
        userId={progressUserId}
        onClose={() => setProgressUserId(null)}
        onEdit={(u) => {
          setProgressUserId(null);
          setEditUser(u);
        }}
      />
      <EditUserDrawer user={editUser} onClose={() => setEditUser(null)} />
    </div>
  );
}

function facetOptions(allLabel: string, values: string[]) {
  return [{ value: "all", label: allLabel }, ...values.map((v) => ({ value: v, label: v }))];
}

function Slicer({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="capitalize">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", team: "", role: "Learner" as AdminRole });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => addUser(form),
    onSuccess: (user) => {
      toast.success(`${user.name} added`);
      setForm({ name: "", email: "", team: "", role: "Learner" });
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="shrink-0">
          <UserPlus className="size-4" strokeWidth={2} />
          Add user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            A convenience for exceptions — most people arrive automatically from HR.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="u-name">Full name</Label>
            <Input
              id="u-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="u-email">Work email</Label>
            <Input
              id="u-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="u-team">Team</Label>
            <Input
              id="u-team"
              value={form.team}
              onChange={(e) => setForm({ ...form, team: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!form.name || !form.email || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Add user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserPanel({
  userId,
  onClose,
  onEdit,
}: {
  userId: string | null;
  onClose: () => void;
  onEdit: (user: AdminUser) => void;
}) {
  const { data: user } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => getUser(userId!),
    enabled: !!userId,
  });
  const { data: progress = [], isPending } = useQuery({
    queryKey: ["admin-user-progress", userId],
    queryFn: () => getUserProgress(userId!),
    enabled: !!userId,
  });

  const counts = {
    assigned: progress.length,
    inProgress: progress.filter((p) => p.status === "in-progress").length,
    complete: progress.filter((p) => p.status === "complete").length,
  };

  return (
    <Sheet open={!!userId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{user?.name ?? "User"}</SheetTitle>
        </SheetHeader>
        <div className="grid gap-5 px-4 pb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {user?.team} · {user?.location} · {user?.role}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                {user?.provisioned === "manual" ? "Added manually" : "Auto-provisioned"}
                {user && isNewJoiner(user.joiningDate) && (
                  <span className="rounded-[4px] bg-cat-onboarding/12 px-1.5 py-0.5 text-[10px] font-[590] text-cat-onboarding">
                    New joiner
                  </span>
                )}
              </p>
            </div>
            {user && (
              <Button size="sm" variant="outline" className="shrink-0" onClick={() => onEdit(user)}>
                <Pencil className="size-3.5" strokeWidth={1.75} />
                Edit
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Assigned", value: counts.assigned },
              { label: "In progress", value: counts.inProgress },
              { label: "Complete", value: counts.complete },
            ].map((s) => (
              <div key={s.label} className="surface px-3 py-2.5">
                <p className="text-label text-muted-foreground">{s.label}</p>
                <p className="tnum mt-0.5 text-xl font-[510]">{s.value}</p>
              </div>
            ))}
          </div>

          {isPending ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : progress.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nothing assigned"
              description="This person has no modules yet."
            />
          ) : (
            <ul className="grid gap-3">
              {progress.map((p) => (
                <li key={p.moduleId} className="surface p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-[510]">{p.title}</p>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn("size-1.5 rounded-full", STATUS_DOT[p.status])} />
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  <Progress value={p.progressPct} className="mt-2.5 h-1.5" />
                  <p className="tnum mt-1.5 text-xs text-muted-foreground">
                    {p.progressPct}% · due {p.dueDate}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
