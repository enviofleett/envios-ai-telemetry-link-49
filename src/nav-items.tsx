
import { HomeIcon, Settings, Car, Navigation, Users, ShoppingCart, Package, MapPin, Wrench, FileText, Activity } from "lucide-react";
import Index from "./pages/Index";
import UserManagement from "./pages/UserManagement";
import VehicleManagement from "./pages/VehicleManagement";
import Marketplace from "./pages/Marketplace";
import PackageManagement from "./pages/PackageManagement";
import LiveTracking from "./pages/LiveTracking";
import UserVehicles from "./pages/UserVehicles";
import Reports from "./pages/Reports";
import Maintenance from "./pages/Maintenance";
import WorkshopManagement from "./pages/WorkshopManagement";
import ActiveServices from "./pages/ActiveServices";
import Settings from "./pages/Settings";

export const navItems = [
  {
    title: "Dashboard",
    to: "/dashboard",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "Live Tracking",
    to: "/tracking",
    icon: <MapPin className="h-4 w-4" />,
    page: <LiveTracking />,
  },
  {
    title: "My Vehicles",
    to: "/my-vehicles",
    icon: <Car className="h-4 w-4" />,
    page: <UserVehicles />,
  },
  {
    title: "Vehicle Management",
    to: "/vehicles",
    icon: <Car className="h-4 w-4" />,
    page: <VehicleManagement />,
  },
  {
    title: "User Management",
    to: "/users",
    icon: <Users className="h-4 w-4" />,
    page: <UserManagement />,
  },
  {
    title: "Reports & Analytics",
    to: "/reports",
    icon: <FileText className="h-4 w-4" />,
    page: <Reports />,
  },
  {
    title: "Maintenance",
    to: "/maintenance",
    icon: <Wrench className="h-4 w-4" />,
    page: <Maintenance />,
  },
  {
    title: "Workshop Management",
    to: "/workshop-management",
    icon: <Wrench className="h-4 w-4" />,
    page: <WorkshopManagement />,
  },
  {
    title: "Marketplace",
    to: "/marketplace",
    icon: <ShoppingCart className="h-4 w-4" />,
    page: <Marketplace />,
  },
  {
    title: "Package Management",
    to: "/packages",
    icon: <Package className="h-4 w-4" />,
    page: <PackageManagement />,
  },
  {
    title: "Active Services",
    to: "/services",
    icon: <Activity className="h-4 w-4" />,
    page: <ActiveServices />,
  },
  {
    title: "Settings",
    to: "/settings",
    icon: <Settings className="h-4 w-4" />,
    page: <Settings />,
  },
];
