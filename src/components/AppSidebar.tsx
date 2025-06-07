
import React, { useState } from 'react';
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
  SidebarTrigger,
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
  Home,
  Cog
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
        title: "Device Configuration",
        url: "/device-configuration",
        icon: Cog,
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

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-r-2 border-sidebar-primary" 
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    <Sidebar 
      variant="inset" 
      className="border-r border-sidebar-border bg-sidebar"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Car className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">FleetIQ</span>
              <span className="text-sm text-sidebar-foreground/70">Management Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        {navigation.map((section) => (
          <SidebarGroup key={section.title} className="mb-6">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-semibold uppercase tracking-wider mb-3">
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
                      className={`h-10 px-3 rounded-lg transition-all duration-200 ${getNavCls({ isActive: isActive(item.url) })}`}
                    >
                      <NavLink to={item.url} end className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium">{item.title}</span>}
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
