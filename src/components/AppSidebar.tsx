
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  BarChart3, 
  Navigation, 
  Users, 
  Settings, 
  Database,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: BarChart3 },
  { title: 'Live Tracking', url: '/tracking', icon: Navigation },
  { title: 'User Management', url: '/users', icon: Users },
  { title: 'Settings', url: '/settings', icon: Settings },
  { title: 'System Import', url: '/system-import', icon: Database },
];

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    main: true
  });

  const isActive = (path: string) => currentPath === path;

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible>
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-3 py-2">
            {!collapsed && (
              <SidebarGroupLabel className="text-sm font-medium text-gray-500">
                Main Navigation
              </SidebarGroupLabel>
            )}
            {!collapsed && (
              <button
                onClick={() => toggleGroup('main')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {expandedGroups.main ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          
          {(collapsed || expandedGroups.main) && (
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
