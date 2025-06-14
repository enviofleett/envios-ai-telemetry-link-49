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
import { FeatureRestrictedLink } from "@/components/common/FeatureRestrictedLink"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Vehicles",
    url: "/vehicles",
    icon: Car,
  },
  {
    title: "Active Services",
    url: "/services",
    icon: CreditCard,
  },
  {
    title: "Maintenance",
    url: "/maintenance",
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
    icon: BarChart3,
  },
  {
    title: "Tracking",
    url: "/tracking",
    icon: Map,
  },
  {
    title: "Marketplace",
    url: "/marketplace",
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
    icon: Settings,
  },
]

const quickActions = [
  {
    title: "Schedule Maintenance",
    icon: Calendar,
    url: "/maintenance"
  },
  {
    title: "Add Vehicle",
    icon: Car,
    url: "/vehicles"
  },
  {
    title: "View Alerts",
    icon: Bell,
    action: () => console.log('View alerts')
  },
]

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();

  // Features for demo (in production assign each menu to a feature id)
  const menuWithFeatures = menuItems.map(item => {
    let featureId: string | undefined;
    if (item.title === "Vehicles") featureId = "vehicle_management";
    if (item.title === "Maintenance") featureId = "maintenance";
    if (item.title === "Reports") featureId = "fleet_reports";
    if (item.title === "Tracking") featureId = "tracking";
    if (item.title === "Marketplace") featureId = "marketplace";
    if (item.title === "Workshop Management") featureId = "workshop_management";
    if (item.title === "Active Services") featureId = "active_services";
    // Add more as needed
    return { ...item, featureId };
  });

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
              {menuWithFeatures.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.featureId ? (
                    <FeatureRestrictedLink featureId={item.featureId}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location.pathname === item.url}
                      >
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </FeatureRestrictedLink>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
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
                    asChild={!!action.url}
                    onClick={action.action}
                  >
                    {action.url ? (
                      <Link to={action.url}>
                        <action.icon className="h-4 w-4 mr-2" />
                        {action.title}
                      </Link>
                    ) : (
                      <>
                        <action.icon className="h-4 w-4 mr-2" />
                        {action.title}
                      </>
                    )}
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
