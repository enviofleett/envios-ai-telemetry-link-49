
"use client"

import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar"
import { menuItems, agentMenuItems, quickActions } from "@/config/sidebar-menu"
import { AppSidebarHeader } from "./sidebar/AppSidebarHeader"
import { AppSidebarNavigation } from "./sidebar/AppSidebarNavigation"
import { AppSidebarQuickActions } from "./sidebar/AppSidebarQuickActions"
import { AppSidebarFooter } from "./sidebar/AppSidebarFooter"
import { useAuth } from "@/contexts/AuthContext"

export function AppSidebar() {
  const { isAgent } = useAuth();
  
  const currentMenuItems = isAgent ? agentMenuItems : menuItems;

  return (
    <Sidebar variant="inset" collapsible="icon">
      <AppSidebarHeader />
      <SidebarContent>
        <AppSidebarNavigation menuItems={currentMenuItems} />
        {!isAgent && <AppSidebarQuickActions quickActions={quickActions} />}
      </SidebarContent>
      <AppSidebarFooter />
    </Sidebar>
  )
}
