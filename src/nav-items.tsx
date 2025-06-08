
import { HomeIcon, Users, Settings, BarChart3 } from "lucide-react";

export const navItems = [
  {
    title: "Dashboard",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: null, // Will be handled by the Index route
  },
  {
    title: "Users",
    to: "/users",
    icon: <Users className="h-4 w-4" />,
    page: null, // Add user management page when needed
  },
  {
    title: "Analytics",
    to: "/analytics", 
    icon: <BarChart3 className="h-4 w-4" />,
    page: null, // Add analytics page when needed
  },
  {
    title: "Settings",
    to: "/settings",
    icon: <Settings className="h-4 w-4" />,
    page: null, // Add settings page when needed
  },
];
