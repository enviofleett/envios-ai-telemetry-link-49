import { HomeIcon, Users, Settings, BarChart3, Car, Wrench, Map, ShoppingCart } from "lucide-react";
import React from "react";

// Import page components
const IndexPage = React.lazy(() => import("./pages/Index"));
const VehiclesPage = React.lazy(() => import("./pages/Vehicles"));
const UsersPage = React.lazy(() => import("./pages/Users"));
const SettingsPage = React.lazy(() => import("./pages/Settings"));
const AnalyticsPage = React.lazy(() => import("./pages/Analytics"));
const MaintenancePage = React.lazy(() => import("./pages/Maintenance"));
const TrackingPage = React.lazy(() => import("./pages/Tracking"));
const MarketplacePage = React.lazy(() => import("./pages/Marketplace"));
const ServicesPage = React.lazy(() => import("./pages/Services"));
const ReportsPage = React.lazy(() => import("./pages/Reports"));

export const navItems = [
  {
    title: "Dashboard",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <React.Suspense fallback={<div>Loading...</div>}><IndexPage /></React.Suspense>,
  },
  {
    title: "Vehicles",
    to: "/vehicles",
    icon: <Car className="h-4 w-4" />,
    page: <React.Suspense fallback={<div>Loading...</div>}><VehiclesPage /></React.Suspense>,
  },
  {
    title: "Services",
    to: "/services",
    icon: <Settings className="h-4 w-4" />,
    page: <React.Suspense fallback={<div>Loading...</div>}><ServicesPage /></React.Suspense>,
  },
  {
    title: "Maintenance",
    to: "/maintenance",
    icon: <Wrench className="h-4 w-4" />,
    page: <React.Suspense fallback={<div>Loading...</div>}><MaintenancePage /></React.Suspense>,
  },
  {
    title: "Tracking",
    to: "/tracking",
    icon: <Map className="h-4 w-4" />,
    page: <React.Suspense fallback={<div>Loading...</div>}><TrackingPage /></React.Suspense>,
  },
  {
    title: "Marketplace",
    to: "/marketplace",
    icon: <ShoppingCart className="h-4 w-4" />,
    page: <React.Suspense fallback={<div>Loading...</div>}><MarketplacePage /></React.Suspense>,
  },
  {
    title: "Reports",
    to: "/reports",
    icon: <BarChart3 className="h-4 w-4" />,
    page: <React.Suspense fallback={<div>Loading...</div>}><ReportsPage /></React.Suspense>,
  },
  {
    title: "Users",
    to: "/users",
    icon: <Users className="h-4 w-4" />,
    page: <React.Suspense fallback={<div>Loading...</div>}><UsersPage /></React.Suspense>,
  },
  {
    title: "Settings",
    to: "/settings",
    icon: <Settings className="h-4 w-4" />,
    page: <React.Suspense fallback={<div>Loading...</div>}><SettingsPage /></React.Suspense>,
  },
];
