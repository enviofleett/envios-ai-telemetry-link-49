
import { Link, useLocation } from "react-router-dom"
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { FeatureRestrictedLink } from "@/components/common/FeatureRestrictedLink"
import { MenuItem } from "@/config/sidebar-menu"

interface AppSidebarNavigationProps {
  menuItems: MenuItem[]
}

export function AppSidebarNavigation({ menuItems }: AppSidebarNavigationProps) {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<string[]>(['GPS51 Platform'])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (url: string) => {
    if (url === '/') return location.pathname === '/'
    return location.pathname.startsWith(url)
  }

  const isParentActive = (item: MenuItem) => {
    if (isActive(item.url)) return true
    if (item.children) {
      return item.children.some(child => isActive(child.url))
    }
    return false
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.children ? (
                <>
                  <SidebarMenuButton
                    onClick={() => toggleExpanded(item.title)}
                    isActive={isParentActive(item)}
                    className="w-full justify-between"
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </div>
                    {expandedItems.includes(item.title) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </SidebarMenuButton>
                  
                  {expandedItems.includes(item.title) && (
                    <SidebarMenuSub>
                      {item.children.map((child) => (
                        <SidebarMenuSubItem key={child.title}>
                          {child.featureId ? (
                            <FeatureRestrictedLink featureId={child.featureId}>
                              <SidebarMenuSubButton 
                                asChild 
                                isActive={isActive(child.url)}
                              >
                                <Link to={child.url}>
                                  <child.icon className="mr-2 h-4 w-4" />
                                  <span>{child.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </FeatureRestrictedLink>
                          ) : (
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(child.url)}
                            >
                              <Link to={child.url}>
                                <child.icon className="mr-2 h-4 w-4" />
                                <span>{child.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          )}
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </>
              ) : (
                <>
                  {item.featureId ? (
                    <FeatureRestrictedLink featureId={item.featureId}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)}
                      >
                        <Link to={item.url}>
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </FeatureRestrictedLink>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                    >
                      <Link to={item.url}>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
