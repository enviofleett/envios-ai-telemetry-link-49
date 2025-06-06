
import React from "react";
import {
  Home,
  Car,
  Truck,
  MapPin,
  Users,
  Settings,
  Database,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const navigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Home,
      },
      {
        title: "Live Tracking",
        url: "/tracking",
        icon: MapPin,
      },
    ]
  },
  {
    title: "Fleet Management",
    items: [
      {
        title: "Fleet Management",
        url: "/fleet",
        icon: Car,
      },
      {
        title: "Vehicle Management",
        url: "/vehicles",
        icon: Truck,
      },
    ]
  },
  {
    title: "Administration",
    items: [
      {
        title: "User Management",
        url: "/users",
        icon: Users,
      },
      {
        title: "System Import",
        url: "/system-import",
        icon: Database,
        adminOnly: true,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
    ]
  }
];

export function AppSidebar() {
  const { isAdmin } = useAuth();

  return (
    <Sidebar variant="inset" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">FleetIQ</h2>
            <p className="text-xs text-sidebar-foreground/60">Management Platform</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4">
        {navigation.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider px-3 mb-2">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items
                  .filter(item => !item.adminOnly || (item.adminOnly && isAdmin))
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="group">
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              isActive 
                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                                : "text-sidebar-foreground/70"
                            )
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="text-xs text-sidebar-foreground/60">
          © 2024 FleetIQ Platform
        </div>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}
