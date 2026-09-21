import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { addUser, getUser, getUserProgress, getUsers } from "@/data/repositories";
import type { AdminRole } from "@/data/types";
import { EmptyState } from "@/components/lessons/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { STATUS_DOT, STATUS_LABEL } from "@/lib/format";
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

function UsersPage() {
  const [query, setQuery] = useState("");
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const { data: users = [], isPending } = useQuery({
    queryKey: ["admin-users", query],
    queryFn: () => getUsers(query),
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-title">Users &amp; Progress</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            People are auto-provisioned from HR. Add someone by hand only when needed.
          </p>
        </div>
        <AddUserDialog />
      </header>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or team"
          aria-label="Search users"
          className="h-9 pl-8"
        />
      </div>

      {isPending ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Nobody matches that search. Clear it, or add a user manually."
        />
      ) : (
        <section className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead className="hidden md:table-cell">User ID</TableHead>
                <TableHead className="hidden lg:table-cell">User Email</TableHead>
                <TableHead className="hidden lg:table-cell">Created On</TableHead>
                <TableHead className="hidden xl:table-cell">Allowed Views</TableHead>
                <TableHead>User Status</TableHead>
                <TableHead className="hidden xl:table-cell">Mobile Number</TableHead>
                <TableHead className="hidden sm:table-cell">Department</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => setOpenUserId(u.id)}
                >
                  <TableCell className="min-w-0">
                    <span className="block truncate text-sm font-[510]">{u.name}</span>
                    <span className="block truncate text-xs text-muted-foreground md:hidden">
                      {u.email}
                    </span>
                  </TableCell>
                  <TableCell className="tnum hidden text-sm text-muted-foreground md:table-cell">
                    {u.userId}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {u.email}
                  </TableCell>
                  <TableCell className="tnum hidden text-sm text-muted-foreground lg:table-cell">
                    {u.createdOn}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">
                    {u.allowedViews.join(", ")}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
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
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {u.department}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      <UserPanel userId={openUserId} onClose={() => setOpenUserId(null)} />
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

function UserPanel({ userId, onClose }: { userId: string | null; onClose: () => void }) {
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
          <div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {user?.team} · {user?.location} · {user?.role}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {user?.provisioned === "manual" ? "Added manually" : "Auto-provisioned"}
            </p>
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
