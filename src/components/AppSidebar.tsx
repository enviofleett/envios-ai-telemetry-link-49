
import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  BarChart3,
  Car,
  Home,
  LayoutDashboard,
  LogOut,
  Map,
  FileText,
  TrendingUp,
  Users,
  Settings,
  Activity
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
} from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"
import { useLocation, useNavigate } from "react-router-dom"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    description: "Overview and metrics"
  },
  {
    title: "Professional Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    description: "Advanced dashboard"
  },
  {
    title: "Vehicle Management",
    url: "/vehicles",
    icon: Car,
    description: "Manage your fleet"
  },
  {
    title: "Live Tracking",
    url: "/tracking",
    icon: Map,
    description: "Real-time vehicle tracking"
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
    description: "Generate reports"
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "Application settings"
  }
]

const analyticsItems = [
  {
    title: "My Analytics",
    url: "/analytics",
    icon: TrendingUp,
    description: "Personal vehicle analytics"
  },
  {
    title: "Fleet Analytics",
    url: "/fleet-analytics",
    icon: BarChart3,
    description: "Fleet performance metrics"
  }
]

export function AppSidebar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Don't show sidebar on mobile - use bottom navigation instead
  if (isMobile) {
    return null;
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-2">
          <Activity className="h-6 w-6 text-primary" />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Envio Fleet</span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              GPS51 Management
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.description}
                  >
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

        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.description}
                  >
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium">
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-medium">{user?.email}</span>
                <span className="truncate text-sidebar-foreground/70">User</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start h-8 px-2"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
