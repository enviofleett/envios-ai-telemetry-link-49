
import React from "react";
import {
  Home,
  Car,
  Truck,
  MapPin,
  Users,
  Settings,
  Database,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  description?: string;
}

export function AppSidebar() {
  const { isAdmin, user } = useAuth();
  const { state } = useSidebar();

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      description: "Fleet overview and analytics"
    },
    {
      title: "Fleet Management",
      url: "/fleet",
      icon: Car,
      description: "Manage your vehicle fleet"
    },
    {
      title: "Vehicle Management",
      url: "/vehicles",
      icon: Truck,
      description: "Individual vehicle controls"
    },
    {
      title: "Live Tracking",
      url: "/tracking",
      icon: MapPin,
      description: "Real-time vehicle tracking"
    },
    {
      title: "Management",
      url: "/users",
      icon: Users,
      description: "User and system management"
    },
    {
      title: "System Import",
      url: "/system-import",
      icon: Database,
      adminOnly: true,
      description: "Data import and management"
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      description: "System configuration"
    },
  ];

  // Filter menu items based on admin status
  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-primary rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-off-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                Envio Telemetry
              </h1>
              <p className="text-xs text-sidebar-foreground/60">
                Fleet Management System
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium mb-4">
            {!isCollapsed ? "Navigation" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {filteredMenuItems.map((menuItem) => {
                const IconComponent = menuItem.icon;
                return (
                  <SidebarMenuItem key={menuItem.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={menuItem.url}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                            isActive 
                              ? "bg-teal-primary text-off-white shadow-md" 
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          }`
                        }
                      >
                        <IconComponent className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {menuItem.title}
                            </div>
                            <div className="text-xs opacity-60 truncate">
                              {menuItem.description}
                            </div>
                          </div>
                        )}
                        {!isCollapsed && (
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-teal-primary/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-teal-primary">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">
                {user.email}
              </div>
              <div className="text-xs text-sidebar-foreground/60">
                {isAdmin ? "Administrator" : "User"}
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
