
import { Link } from "react-router-dom"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { QuickAction } from "@/config/sidebar-menu"

interface AppSidebarQuickActionsProps {
  quickActions: QuickAction[]
}

export function AppSidebarQuickActions({ quickActions }: AppSidebarQuickActionsProps) {
  const { state } = useSidebar()

  if (state !== "expanded") {
    return null
  }

  return (
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
  )
}
