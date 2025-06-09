
import { HomeIcon, Settings, Car, Navigation, BarChart3, ShoppingCart, Users, FileText } from "lucide-react";
import Index from "./pages/Index";
import UserManagement from "./pages/UserManagement";
import VehicleManagement from "./pages/VehicleManagement";
import LiveTracking from "./pages/LiveTracking";
import EnhancedLiveTracking from "./pages/EnhancedLiveTracking";
import Reports from "./pages/Reports";
import AdminSettings from "./pages/AdminSettings";
import Marketplace from "./pages/Marketplace";

export const navItems = [
  {
    title: "Dashboard",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "User Management",
    to: "/users",
    icon: <Users className="h-4 w-4" />,
    page: <UserManagement />,
  },
  {
    title: "Vehicle Management",
    to: "/vehicles",
    icon: <Car className="h-4 w-4" />,
    page: <VehicleManagement />,
  },
  {
    title: "Live Tracking",
    to: "/tracking",
    icon: <Navigation className="h-4 w-4" />,
    page: <LiveTracking />,
  },
  {
    title: "Enhanced Tracking",
    to: "/enhanced-tracking",
    icon: <Navigation className="h-4 w-4" />,
    page: <EnhancedLiveTracking />,
  },
  {
    title: "Reports",
    to: "/reports",
    icon: <FileText className="h-4 w-4" />,
    page: <Reports />,
  },
  {
    title: "Marketplace",
    to: "/marketplace",
    icon: <ShoppingCart className="h-4 w-4" />,
    page: <Marketplace />,
  },
  {
    title: "Admin Settings",
    to: "/admin",
    icon: <Settings className="h-4 w-4" />,
    page: <AdminSettings />,
  },
];
