import React from "react";
import {
  Home,
  Car,
  Truck,
  Users,
  Download,
  Settings,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType;
  items?: { title: string; url: string }[];
}

export function AppSidebar() {
  const location = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Fleet Management",
      url: "/fleet",
      icon: Car,
      items: [
        {
          title: "Fleet Overview",
          url: "/fleet",
        },
        {
          title: "Analytics & Intelligence",
          url: "/fleet/analytics",
        },
      ],
    },
    {
      title: "Vehicle Management",
      url: "/vehicles",
      icon: Truck,
      items: [
        {
          title: "Enhanced Management",
          url: "/vehicles",
        },
        {
          title: "Stable Management",
          url: "/vehicles/stable",
        },
        {
          title: "Basic Management",
          url: "/vehicles/manage",
        },
      ],
    },
    {
      title: "User Management",
      url: "/users",
      icon: Users,
    },
    {
      title: "Data Import",
      url: "/extraction",
      icon: Download,
      items: [
        {
          title: "Bulk Extraction",
          url: "/extraction",
        },
        {
          title: "Review Import",
          url: "/import/review",
        },
      ],
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
        {menuItems.map((menuItem, index) => (
          <div key={index} className="mb-1">
            <NavLink
              to={menuItem.url}
              className={({ isActive }) =>
                `flex items-center py-2 px-4 rounded-md hover:bg-gray-200 ${
                  isActive ? "bg-gray-200 font-medium" : ""
                }`
              }
            >
              <menuItem.icon className="h-4 w-4 mr-2" />
              {menuItem.title}
            </NavLink>
            {menuItem.items && (
              <div className="ml-4">
                {menuItem.items.map((item, i) => (
                  <NavLink
                    key={i}
                    to={item.url}
                    className={({ isActive }) =>
                      `flex items-center py-2 px-4 rounded-md hover:bg-gray-200 ${
                        isActive ? "bg-gray-200 font-medium" : ""
                      }`
                    }
                  >
                    - {item.title}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
