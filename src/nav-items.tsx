
import { HomeIcon, Settings, Car, Navigation, Users, ShoppingCart, Package } from "lucide-react";
import Index from "./pages/Index";
import UserManagement from "./pages/UserManagement";
import VehicleManagement from "./pages/VehicleManagement";
import Marketplace from "./pages/Marketplace";
import PackageManagement from "./pages/PackageManagement";

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
];
