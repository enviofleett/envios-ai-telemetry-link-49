
import React from "react"
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"
import { useIsMobile } from "@/hooks/use-mobile"
import { Activity, LogOut } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"
import { useLocation, useNavigate } from "react-router-dom"
import { AppSidebarNavigation } from "./sidebar/AppSidebarNavigation"
import { AppSidebarQuickActions } from "./sidebar/AppSidebarQuickActions"
import { menuItems, agentMenuItems, quickActions } from "@/config/sidebar-menu"

export function AppSidebar() {
  const { user, signOut, loading } = useUnifiedAuth()
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

  // Show loading state while checking auth
  if (loading) {
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
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  // For now, use the full menu items since we don't have role checking in UnifiedAuth yet
  const currentMenuItems = menuItems;

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
        <AppSidebarNavigation menuItems={currentMenuItems} />
        
        {/* Show quick actions for authenticated users */}
        {user && <AppSidebarQuickActions quickActions={quickActions} />}
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
                <span className="truncate text-sidebar-foreground/70">
                  User
                </span>
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
