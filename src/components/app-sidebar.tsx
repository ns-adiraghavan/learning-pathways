import { Link, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  BookOpen,
  ClipboardList,
  Compass,
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
  { title: "Browse", url: "/browse", icon: Compass },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Certificates", url: "/certificates", icon: Award },
] as const;

const trainerItems = [
  { title: "Programs", url: "/trainer/programs", icon: Layers },
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
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3">
        <Link to="/home" className="min-w-0" aria-label="NS Lessons by Netscribes">
          <BrandLockup markOnly={collapsed} compact size="sm" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-2 py-3">
          {!collapsed && (
            <SidebarGroupLabel className="px-2 text-[10px] tracking-[0.12em] uppercase text-muted-foreground">
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
                        className="absolute inset-0 rounded-md bg-sidebar-primary"
                        style={{
                          right: 0,
                        }}
                      />
                    )}
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={active}
                      className="relative z-10 h-8 data-[active=true]:bg-transparent data-[active=true]:text-sidebar-primary-foreground"
                    >
                      <Link
                        to={item.url}
                        className={
                          collapsed
                            ? "flex items-center justify-center"
                            : "flex items-center gap-2.5"
                        }
                      >
                        {!collapsed && (
                          <span
                            aria-hidden
                            className="h-4 w-[2px] shrink-0 rounded-full transition-colors"
                            style={{
                              background: active
                                ? "var(--sidebar-primary-foreground)"
                                : "color-mix(in oklab, var(--color-foreground) 14%, transparent)",
                            }}
                          />
                        )}
                        <item.icon
                          strokeWidth={1.75}
                          className={
                            active
                              ? "size-4 shrink-0 text-sidebar-primary-foreground"
                              : "size-4 shrink-0 text-muted-foreground"
                          }
                        />
                        {!collapsed && (
                          <span
                            className={
                              active
                                ? "font-[590] text-sidebar-primary-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {item.title}
                          </span>
                        )}
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
