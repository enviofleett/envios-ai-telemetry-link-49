
import {
  BarChart3,
  Calendar,
  Car,
  Home,
  Settings,
  Wrench,
  Map,
  Users,
  Bell,
  ShoppingCart,
  Building2,
  CreditCard,
  LucideIcon,
  Store,
  User,
  Hash,
  DollarSign,
} from "lucide-react"

export interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  featureId?: string;
}

export interface QuickAction {
  title: string;
  icon: LucideIcon;
  url?: string;
  action?: () => void;
}

export const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Vehicles",
    url: "/vehicles",
    icon: Car,
    featureId: "vehicle_management",
  },
  {
    title: "Active Services",
    url: "/services",
    icon: CreditCard,
    featureId: "active_services",
  },
  {
    title: "Maintenance",
    url: "/maintenance",
    icon: Wrench,
    featureId: "maintenance",
  },
  {
    title: "Workshop Management",
    url: "/workshop-management",
    icon: Building2,
    featureId: "workshop_management",
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    featureId: "fleet_reports",
  },
  {
    title: "Tracking",
    url: "/tracking",
    icon: Map,
    featureId: "tracking",
  },
  {
    title: "Marketplace",
    url: "/marketplace",
    icon: ShoppingCart,
    featureId: "marketplace",
  },
  {
    title: "Become a Merchant",
    url: "/merchant-application",
    icon: Store,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Referral Agents",
    url: "/referral-agents",
    icon: Users,
    featureId: "referral_management",
  },
  {
    title: "Market Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
    featureId: "admin_analytics",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export const agentMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/agent/dashboard",
    icon: Home,
  },
  {
    title: "Referral Codes",
    url: "/agent/referral-codes",
    icon: Hash,
  },
  {
    title: "Referred Users",
    url: "/agent/referred-users",
    icon: Users,
  },
  {
    title: "Commissions",
    url: "/agent/commissions",
    icon: CreditCard,
  },
  {
    title: "Payouts",
    url: "/agent/payouts",
    icon: DollarSign,
  },
  {
    title: "Profile",
    url: "/agent/profile",
    icon: User,
  },
];

export const quickActions: QuickAction[] = [
  {
    title: "Schedule Maintenance",
    icon: Calendar,
    url: "/maintenance"
  },
  {
    title: "Add Vehicle",
    icon: Car,
    url: "/vehicles"
  },
  {
    title: "View Alerts",
    icon: Bell,
    action: () => console.log('View alerts')
  },
]
