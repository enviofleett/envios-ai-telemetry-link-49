
import React from "react";
import {
  Home,
  Car,
  Truck,
  MapPin,
  Users,
  Settings,
  Database,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export function AppSidebar() {
  const { isAdmin } = useAuth();

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Fleet Management",
      url: "/fleet",
      icon: Car,
    },
    {
      title: "Vehicle Management",
      url: "/vehicles",
      icon: Truck,
    },
    {
      title: "Live Tracking",
      url: "/tracking",
      icon: MapPin,
    },
    {
      title: "User Management",
      url: "/users",
      icon: Users,
    },
    {
      title: "System Import",
      url: "/system-import",
      icon: Database,
      adminOnly: true,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  // Filter menu items based on admin status
  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <div className="w-64 bg-gray-100 min-h-screen py-4 px-2">
      <div className="font-bold text-lg mb-4 px-2">Envio Telemetry</div>
      <nav>
        {filteredMenuItems.map((menuItem, index) => {
          const IconComponent = menuItem.icon;
          return (
            <div key={index} className="mb-1">
              <NavLink
                to={menuItem.url}
                className={({ isActive }) =>
                  `flex items-center py-2 px-4 rounded-md hover:bg-gray-200 ${
                    isActive ? "bg-gray-200 font-medium" : ""
                  }`
                }
              >
                <IconComponent size={16} className="mr-2" />
                {menuItem.title}
              </NavLink>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
