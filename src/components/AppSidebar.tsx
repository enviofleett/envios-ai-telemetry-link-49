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
  Building2,
  CreditCard,
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
import { Link, useLocation } from "react-router-dom"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    hash: "#dashboard",
    icon: Home,
  },
  {
    title: "Vehicles",
    url: "/vehicles",
    hash: "#vehicles",
    icon: Car,
  },
  {
    title: "Active Services",
    url: "/services",
    hash: "#active-services",
    icon: CreditCard,
  },
  {
    title: "Maintenance",
    url: "/maintenance",
    hash: "#maintenance",
    icon: Wrench,
  },
  {
    title: "Workshop Management",
    url: "/workshop-management",
    icon: Building2,
  },
  {
    title: "Reports",
    url: "/reports",
    hash: "#reports",
    icon: BarChart3,
  },
  {
    title: "Tracking",
    url: "/tracking",
    hash: "#tracking",
    icon: Map,
  },
  {
    title: "Marketplace",
    url: "/marketplace",
    hash: "#marketplace",
    icon: ShoppingCart,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    hash: "#settings",
    icon: Settings,
  },
]

const quickActions = [
  {
    title: "Schedule Maintenance",
    icon: Calendar,
    action: () => window.location.hash = '#maintenance'
  },
  {
    title: "Add Vehicle",
    icon: Car,
    action: () => window.location.hash = '#vehicles'
  },
  {
    title: "View Alerts",
    icon: Bell,
    action: () => console.log('View alerts')
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (location.pathname === "/" && item.hash) {
      // If we're on the main dashboard page and the item has a hash, use hash navigation
      window.location.hash = item.hash
    } else {
      // Otherwise, use regular routing
      window.location.href = item.url
    }
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
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
                  <SidebarMenuButton 
                    asChild={!item.hash || location.pathname !== "/"} 
                    isActive={location.pathname === item.url}
                  >
                    {item.hash && location.pathname === "/" ? (
                      <button onClick={() => handleMenuClick(item)} className="w-full flex items-center">
                        <item.icon />
                        <span>{item.title}</span>
                      </button>
                    ) : (
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    )}
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
                  <Button 
                    key={action.title} 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={action.action}
                  >
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
