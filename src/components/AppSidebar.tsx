
"use client"

import {
  BarChart3,
  Calendar,
  Car,
  Home,
  Settings,
  Wrench,
  Map,
  Users,
  Bell,
  ShoppingCart,
  Zap,
  Building2,
} from "lucide-react"

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
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const menuItems = [
  {
    title: "Dashboard",
    url: "#dashboard",
    icon: Home,
  },
  {
    title: "Vehicles",
    url: "#vehicles",
    icon: Car,
  },
  {
    title: "Maintenance",
    url: "#maintenance",
    icon: Wrench,
  },
  {
    title: "Workshop Management",
    url: "#workshop-management",
    icon: Building2,
  },
  {
    title: "Reports",
    url: "#reports",
    icon: BarChart3,
  },
  {
    title: "Tracking",
    url: "#tracking",
    icon: Map,
  },
  {
    title: "Marketplace",
    url: "#marketplace",
    icon: ShoppingCart,
  },
  {
    title: "Active Services",
    url: "#active-services",
    icon: Zap,
  },
  {
    title: "Settings",
    url: "#settings",
    icon: Settings,
  },
]

const quickActions = [
  {
    title: "Schedule Maintenance",
    icon: Calendar,
  },
  {
    title: "Add Vehicle",
    icon: Car,
  },
  {
    title: "View Alerts",
    icon: Bell,
  },
]

export function AppSidebar() {
  const { state } = useSidebar()

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          {state === "expanded" && (
            <div>
              <p className="text-sm font-semibold">Envio Fleet</p>
              <p className="text-xs text-muted-foreground">Management Platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {state === "expanded" && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-2 px-2">
                {quickActions.map((action) => (
                  <Button key={action.title} variant="outline" size="sm" className="w-full justify-start">
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.title}
                  </Button>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Users />
              <span>Fleet Manager</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
