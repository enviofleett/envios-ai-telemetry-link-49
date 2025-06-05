
import React from "react";
import {
  Home,
  Car,
  Truck,
  MapPin,
  Users,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export function AppSidebar() {
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
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="w-64 bg-gray-100 min-h-screen py-4 px-2">
      <div className="font-bold text-lg mb-4 px-2">Envio Telemetry</div>
      <nav>
        {menuItems.map((menuItem, index) => {
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
