
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FiHome, 
  FiTrendingUp, 
  FiCompass, 
  FiStar, 
  FiSettings 
} from 'react-icons/fi';
import { Car, ChevronDown, LogOut, User } from 'lucide-react';

interface NavItemProps {
  icon: React.ComponentType<any>;
  title: string;
  url: string;
  active: boolean;
  collapsed: boolean;
  items?: Array<{
    title: string;
    url: string;
  }>;
}

const NavItem = ({ icon: Icon, title, url, active, collapsed, items }: NavItemProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (items && items.length > 0) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={cn(
              "w-full justify-between rounded-lg p-3 transition-colors",
              active && "bg-[#AEC8CA] text-[#82AAAD]",
              "hover:bg-[#AEC8CA] hover:text-[#82AAAD]"
            )}
          >
            <div className="flex items-center">
              <Icon className={cn("text-xl", active ? "text-[#82AAAD]" : "text-gray-500")} />
              {!collapsed && <span className="ml-5">{title}</span>}
            </div>
            {!collapsed && <ChevronDown className="h-4 w-4" />}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {!collapsed && (
          <CollapsibleContent className="space-y-1 pl-6">
            {items.map((subItem) => (
              <SidebarMenuButton key={subItem.title} asChild>
                <Link 
                  to={subItem.url}
                  className="block rounded-lg p-2 text-sm hover:bg-[#AEC8CA] hover:text-[#82AAAD]"
                >
                  {subItem.title}
                </Link>
              </SidebarMenuButton>
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    );
  }

  return (
    <SidebarMenuButton asChild>
      <Link
        to={url}
        className={cn(
          "flex items-center rounded-lg p-3 transition-colors w-full",
          active && "bg-[#AEC8CA] text-[#82AAAD]",
          "hover:bg-[#AEC8CA] hover:text-[#82AAAD]"
        )}
      >
        <Icon className={cn("text-xl", active ? "text-[#82AAAD]" : "text-gray-500")} />
        {!collapsed && <span className="ml-5">{title}</span>}
      </Link>
    </SidebarMenuButton>
  );
};

export const AppSidebar = () => {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();

  const navItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: FiHome,
    },
    {
      title: "Live Tracking",
      url: "/tracking",
      icon: FiTrendingUp,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: FiCompass,
    },
    {
      title: "Marketplace",
      url: "/marketplace",
      icon: FiStar,
    },
    {
      title: "Vehicle Management",
      url: "/vehicles",
      icon: Car,
      items: [
        {
          title: "All Vehicles",
          url: "/vehicles",
        },
        {
          title: "Device Configuration",
          url: "/device-configuration",
        },
        {
          title: "Maintenance",
          url: "/maintenance",
        },
      ],
    },
    {
      title: "User Management",
      url: "/users",
      icon: User,
    },
    ...(isAdmin ? [{
      title: "Workshop Management",
      url: "/workshop-management",
      icon: FiSettings,
    }] : []),
    ...(isAdmin ? [{
      title: "System Import",
      url: "/system-import",
      icon: FiSettings,
    }] : []),
    {
      title: "Settings",
      url: "/settings",
      icon: FiSettings,
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Sidebar
      className={cn(
        "fixed left-5 top-[1vh] h-[98vh] transition-all duration-300 ease-in-out rounded-xl shadow-lg bg-white border-0",
        collapsed ? "w-[75px]" : "w-[200px]"
      )}
      collapsible
    >
      <SidebarContent className="p-4">
        {/* User Profile Section */}
        <div className={cn("mb-6", collapsed ? "flex justify-center" : "")}>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none focus:outline-none w-full">
                  <div className={cn("flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50", collapsed && "justify-center")}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                      <AvatarFallback>{user?.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                        <p className="text-xs text-gray-500">{isAdmin ? 'Admin' : 'User'}</p>
                      </div>
                    )}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 ml-2">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2">
                    <FiSettings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavItem
                    icon={item.icon}
                    title={item.title}
                    url={item.url}
                    active={location.pathname === item.url}
                    collapsed={collapsed}
                    items={item.items}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapse Toggle */}
        <div className={cn("mt-auto pt-4", collapsed ? "flex justify-center" : "")}>
          <SidebarTrigger className="w-full rounded-lg p-2 hover:bg-gray-100" />
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
