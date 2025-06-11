
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Car,
  Users,
  MapPin,
  CreditCard,
  Settings,
  Wrench,
  Upload,
  Receipt,
  LogOut
} from 'lucide-react';

const AppSidebar = () => {
  const location = useLocation();
  const { signOut, user, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigationItems = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
      requiresAdmin: false,
    },
    {
      title: 'Vehicles',
      url: '/vehicles',
      icon: Car,
      requiresAdmin: false,
    },
    {
      title: 'Users',
      url: '/users',
      icon: Users,
      requiresAdmin: true,
    },
    {
      title: 'Location History',
      url: '/location-history',
      icon: MapPin,
      requiresAdmin: false,
    },
    {
      title: 'Subscriptions',
      url: '/subscriptions',
      icon: CreditCard,
      requiresAdmin: false,
    },
    {
      title: 'Billing',
      url: '/billing',
      icon: Receipt,
      requiresAdmin: true,
    },
    {
      title: 'Maintenance',
      url: '/maintenance',
      icon: Wrench,
      requiresAdmin: false,
    },
    {
      title: 'System Import',
      url: '/import',
      icon: Upload,
      requiresAdmin: true,
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings,
      requiresAdmin: true,
    },
  ];

  const filteredItems = navigationItems.filter(item => 
    !item.requiresAdmin || isAdmin
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <Car className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">FleetIQ</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                        location.pathname === item.url
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3 w-3" />
            Logout
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
