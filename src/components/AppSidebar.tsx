
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  BarChart3, 
  Navigation, 
  Users, 
  Settings, 
  Database,
  Car,
  Home
} from 'lucide-react';

const navigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Home,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "User Management",
        url: "/users",
        icon: Users,
      },
      {
        title: "Live Tracking",
        url: "/tracking",
        icon: Navigation,
      },
      {
        title: "System Import",
        url: "/system-import",
        icon: Database,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isCollapsed = state === "collapsed";
  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar 
      variant="inset" 
      className="border-r border-border bg-card w-64 shadow-sm"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border p-6 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">FleetIQ</span>
              <span className="text-xs text-muted-foreground font-medium">Management Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        {navigation.map((section) => (
          <SidebarGroup key={section.title} className="mb-6">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3 px-2">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      className={`nav-item-modern ${
                        isActive(item.url) 
                          ? 'nav-item-active shadow-sm' 
                          : 'nav-item-inactive'
                      } group relative overflow-hidden`}
                    >
                      <NavLink to={item.url} end className="flex items-center gap-3 w-full">
                        <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                          isActive(item.url) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        }`} />
                        {!isCollapsed && (
                          <span className={`font-medium transition-colors duration-200 truncate ${
                            isActive(item.url) ? 'text-primary' : 'text-foreground'
                          }`}>
                            {item.title}
                          </span>
                        )}
                        {/* Active indicator */}
                        {isActive(item.url) && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
