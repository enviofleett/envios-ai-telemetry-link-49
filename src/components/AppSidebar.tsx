
"use client"

import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar"
import { menuItems, quickActions } from "@/config/sidebar-menu"
import { AppSidebarHeader } from "./sidebar/AppSidebarHeader"
import { AppSidebarNavigation } from "./sidebar/AppSidebarNavigation"
import { AppSidebarQuickActions } from "./sidebar/AppSidebarQuickActions"
import { AppSidebarFooter } from "./sidebar/AppSidebarFooter"

export function AppSidebar() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <AppSidebarHeader />
      <SidebarContent>
        <AppSidebarNavigation menuItems={menuItems} />
        <AppSidebarQuickActions quickActions={quickActions} />
      </SidebarContent>
      <AppSidebarFooter />
    </Sidebar>
  )
}
