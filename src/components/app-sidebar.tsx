import { Link, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  BookOpen,
  ClipboardList,
  FileQuestion,
  Home,
  Layers,
  Settings2,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

import { motion } from "framer-motion";

import { BrandLockup } from "@/components/brand-lockup";
import { useViewMode } from "@/hooks/use-view-mode";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const learnerItems = [
  { title: "Home", url: "/home", icon: Home },
  { title: "My Learning", url: "/my-learning", icon: BookOpen },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Certificates", url: "/certificates", icon: Award },
] as const;

const trainerItems = [
  { title: "Programs", url: "/trainer/programs", icon: Layers },
  { title: "Quiz Builder", url: "/trainer/quizzes", icon: FileQuestion },
  { title: "Certificates", url: "/certificates", icon: Award },
] as const;

const adminItems = [
  { title: "Overview", url: "/admin", icon: Home },
  { title: "Users & Progress", url: "/admin/users", icon: Users },
  { title: "Assignments", url: "/admin/assignments", icon: ClipboardList },
  { title: "Mandatory Quizzes", url: "/admin/mandatory-quizzes", icon: ShieldCheck },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
  { title: "Customization", url: "/admin/customization", icon: Settings2 },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { mode } = useViewMode();

  const admin = mode === "admin" || pathname.startsWith("/admin");
  const trainer = !admin && (mode === "trainer" || pathname.startsWith("/trainer"));
  const items = admin ? adminItems : trainer ? trainerItems : learnerItems;
  const groupLabel = admin ? "Administration" : trainer ? "Authoring" : "Learning";
  const accent = admin
    ? "var(--brand-blue)"
    : trainer
      ? "var(--cat-onboarding)"
      : "var(--color-primary)";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border"
      style={{ ["--view-accent" as string]: accent }}
    >
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3">
        <Link to="/home" className="overflow-hidden" aria-label="NS Lessons by Netscribes">
          <BrandLockup markOnly={collapsed} size="sm" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[11px] tracking-[0.12em] uppercase">
              {groupLabel}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  item.url === "/home" || item.url === "/admin"
                    ? pathname === item.url
                    : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title} className="relative">
                    {active && (
                      <motion.span
                        layoutId={`nav-indicator-${groupLabel}`}
                        transition={{ type: "spring", stiffness: 420, damping: 38 }}
                        className="absolute inset-y-0.5 left-0 rounded-lg"
                        style={{
                          right: 0,
                          background:
                            "color-mix(in oklab, var(--view-accent) 12%, transparent)",
                        }}
                      />
                    )}
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className="relative z-10 data-[active=true]:bg-transparent"
                    >
                      <Link to={item.url} className="flex items-center gap-2.5">
                        <span
                          aria-hidden
                          className="h-4 w-[2px] shrink-0 rounded-full transition-colors"
                          style={{
                            background: active
                              ? "var(--view-accent)"
                              : "color-mix(in oklab, var(--color-foreground) 14%, transparent)",
                          }}
                        />
                        <item.icon
                          className="size-4"
                          strokeWidth={1.75}
                          style={active ? { color: "var(--view-accent)" } : undefined}
                        />
                        <span
                          className={active ? "font-[590]" : "text-muted-foreground"}
                          style={active ? { color: "var(--view-accent)" } : undefined}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
