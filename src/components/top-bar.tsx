import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Moon, Search, Sun, UserCog } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "@/hooks/use-theme";
import { useViewMode } from "@/hooks/use-view-mode";
import { getCurrentUser, getNotifications } from "@/data/repositories";

export function TopBar() {
  const { theme, toggle } = useTheme();
  const { mode, setViewMode } = useViewMode();
  const navigate = useNavigate();
  const { data: user } = useQuery({ queryKey: ["current-user"], queryFn: getCurrentUser });
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });
  const unread = notifications.filter((n) => !n.read).length;

  const initials = (user?.name ?? "NS")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger className="shrink-0" />

      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={mode === "trainer" ? "Search programs, modules" : "Search modules"}
          aria-label="Search modules"
          className="h-9 rounded-md pl-8"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4" strokeWidth={1.75} />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-status-overdue" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <p className="text-label border-b border-border px-3 py-2.5">Notifications</p>
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nothing new right now.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id} className="border-b border-border px-3 py-2.5 last:border-0">
                    <p className="text-sm font-[510]">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? (
            <Sun className="size-4" strokeWidth={1.75} />
          ) : (
            <Moon className="size-4" strokeWidth={1.75} />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-1.5">
              <Avatar className="size-6">
                <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:inline">{user?.name ?? "Guest"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-[510]">
              {user?.name ?? "Guest"}
              <span className="block text-xs font-normal text-muted-foreground">
                {user?.team ?? "—"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Completed Modules</DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                const next = mode === "trainer" ? "learner" : "trainer";
                setViewMode(next);
                navigate({ to: next === "trainer" ? "/trainer/programs" : "/" });
              }}
            >
              <UserCog className="size-4" />
              {mode === "trainer" ? "Switch to Learner View" : "Switch to Trainer View"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
