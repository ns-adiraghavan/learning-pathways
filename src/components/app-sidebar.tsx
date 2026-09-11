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
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";

import logoLight from "@/assets/ns-logo.png.asset.json";
import logoDark from "@/assets/ns-logo-white.png.asset.json";
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
  { title: "Home", url: "/", icon: Home },
  { title: "My Learning", url: "/my-learning", icon: BookOpen },
  { title: "Progress", url: "/progress", icon: TrendingUp },
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
        <Link to="/" className="overflow-hidden" aria-label="Lessons by Netscribes">
          <BrandLockup markOnly={collapsed} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  item.url === "/" || item.url === "/admin"
                    ? pathname === item.url
                    : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="size-4" strokeWidth={1.75} />
                        <span>{item.title}</span>
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
