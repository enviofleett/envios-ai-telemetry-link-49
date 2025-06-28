
import {
  LayoutDashboard,
  Users,
  Car,
  MapPin,
  BarChart3,
  Settings,
  FileText,
  Package,
  Wrench,
  ShoppingCart,
  Activity,
  UserPlus,
  Navigation,
  CreditCard,
  UserCheck,
  TrendingUp,
  Radio,
  Satellite
} from "lucide-react"

export interface MenuItem {
  title: string
  url: string
  icon: any
  featureId?: string
}

export interface QuickAction {
  title: string
  url?: string
  icon: any
  action?: () => void
}

export const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Live Tracking",
    url: "/tracking",
    icon: MapPin,
    featureId: "live_tracking"
  },
  {
    title: "Fleet Management",
    url: "/vehicles",
    icon: Car,
    featureId: "vehicle_management"
  },
  {
    title: "My Vehicles",
    url: "/my-vehicles",
    icon: Navigation,
    featureId: "vehicle_access"
  },
  {
    title: "User Management",
    url: "/users",
    icon: Users,
    featureId: "user_management"
  },
  {
    title: "GP51 Integration",
    url: "/gp51-integration",
    icon: Radio,
    featureId: "gp51_integration"
  },
  {
    title: "GPS51 Integration",
    url: "/gps51",
    icon: Satellite,
    featureId: "gps51_integration"
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
    featureId: "reporting"
  },
  {
    title: "Maintenance",
    url: "/maintenance",
    icon: Wrench,
    featureId: "maintenance"
  },
  {
    title: "Workshop Management",
    url: "/workshop-management",
    icon: Wrench,
    featureId: "workshop_management"
  },
  {
    title: "Marketplace",
    url: "/marketplace",
    icon: ShoppingCart,
    featureId: "marketplace"
  },
  {
    title: "Package Management",
    url: "/packages",
    icon: Package,
    featureId: "package_management"
  },
  {
    title: "Active Services",
    url: "/services",
    icon: Activity,
    featureId: "service_management"
  },
  {
    title: "System Import",
    url: "/system-import",
    icon: Users,
    featureId: "system_import"
  },
  {
    title: "Device Configuration",
    url: "/device-configuration",
    icon: Settings,
    featureId: "device_config"
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
    featureId: "analytics"
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    featureId: "admin_settings"
  },
  {
    title: "Merchant Application",
    url: "/merchant-application",
    icon: UserPlus,
    featureId: "merchant_app"
  },
  {
    title: "Referral Agents",
    url: "/referral-agents",
    icon: UserCheck,
    featureId: "referral_management"
  },
]

// Add the missing agentMenuItems export (can be same as menuItems or a subset)
export const agentMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Live Tracking",
    url: "/tracking",
    icon: MapPin,
    featureId: "live_tracking"
  },
  {
    title: "Fleet Management",
    url: "/vehicles",
    icon: Car,
    featureId: "vehicle_management"
  },
  {
    title: "GP51 Integration",
    url: "/gp51-integration",
    icon: Radio,
    featureId: "gp51_integration"
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
    featureId: "reporting"
  },
]

// Add the missing quickActions export (renamed from quickActionsData)
export const quickActions: QuickAction[] = [
  {
    title: "Add Vehicle",
    url: "/vehicles/add",
    icon: Car,
  },
  {
    title: "Create User",
    url: "/users/create",
    icon: Users,
  },
  {
    title: "View Reports",
    url: "/reports",
    icon: FileText,
  },
  {
    title: "GP51 Setup",
    url: "/gp51-integration",
    icon: Radio,
  },
]

// Keep the old export for backward compatibility
export const quickActionsData: QuickAction[] = quickActions
