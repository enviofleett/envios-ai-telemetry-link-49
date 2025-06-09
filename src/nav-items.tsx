
import { HomeIcon, Settings, Car, Navigation, BarChart3, ShoppingCart, Users, FileText, Package, Database, Cog } from "lucide-react";
import Index from "./pages/Index";
import UserManagement from "./pages/UserManagement";
import VehicleManagement from "./pages/VehicleManagement";
import Reports from "./pages/Reports";
import Marketplace from "./pages/Marketplace";
import PackageManagement from "./pages/PackageManagement";
import SystemImport from "./pages/SystemImport";
import DeviceConfiguration from "./pages/DeviceConfiguration";

export const navItems = [
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
    title: "Package Management",
    to: "/packages",
    icon: <Package className="h-4 w-4" />,
    page: <PackageManagement />,
  },
  {
    title: "System Import",
    to: "/system-import",
    icon: <Database className="h-4 w-4" />,
    page: <SystemImport />,
  },
  {
    title: "Device Configuration",
    to: "/device-configuration",
    icon: <Cog className="h-4 w-4" />,
    page: <DeviceConfiguration />,
  },
];
