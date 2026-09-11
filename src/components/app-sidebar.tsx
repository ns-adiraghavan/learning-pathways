import { Link, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  FileQuestion,
  Home,
  Layers,
  Trophy,
  TrendingUp,
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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { mode } = useViewMode();

  const trainer = mode === "trainer" || pathname.startsWith("/trainer");
  const items = trainer ? trainerItems : learnerItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3">
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <img src={logoLight.url} alt="Netscribes" className="h-5 w-auto dark:hidden" />
          <img src={logoDark.url} alt="Netscribes" className="hidden h-5 w-auto dark:block" />
          {!collapsed && (
            <span className="truncate text-[15px] font-[590] tracking-tight">Lessons</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel>{trainer ? "Authoring" : "Learning"}</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
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
