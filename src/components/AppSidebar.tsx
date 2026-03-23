import { useState } from "react";
import { Home, MapPin, History, BarChart3, Settings, Zap, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Trip History", url: "/history", icon: History },
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

const devItems = [
  { title: "Simulate Trips", url: "/simulate", icon: Zap },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [scientistMode, setScientistMode] = useState(false);
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavCls = (isActiveRoute: boolean) =>
    isActiveRoute 
      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent className="gap-0">
        {/* Main Navigation */}
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={getNavCls(isActive(item.url))}
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Scientist Mode Toggle */}
        {!collapsed && (
          <SidebarGroup className="px-2 mt-6">
            <SidebarGroupLabel>Mode</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scientistMode}
                    onChange={(e) => setScientistMode(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-muted-foreground">
                    Scientist View
                  </span>
                </label>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Developer Tools */}
        <SidebarGroup className="px-2 mt-auto mb-4">
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Developer
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {devItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink 
                      to={item.url}
                      className={getNavCls(isActive(item.url))}
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}