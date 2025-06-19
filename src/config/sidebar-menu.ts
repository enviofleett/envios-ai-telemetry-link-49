
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
  TrendingUp
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
  }
]

export const agentMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Referral Management",
    url: "/referral-agents",
    icon: UserPlus,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: TrendingUp,
  },
  {
    title: "Merchant Application",
    url: "/merchant-application",
    icon: CreditCard,
  }
]

export const quickActions: QuickAction[] = [
  {
    title: "Add User",
    url: "/users?action=add",
    icon: UserPlus,
  },
  {
    title: "View Reports",
    url: "/reports",
    icon: FileText,
  },
  {
    title: "System Health",
    url: "/settings?tab=health",
    icon: Activity,
  }
]
