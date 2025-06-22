
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  MapPin,
  Car,
  Users,
  Settings,
  FileText,
  Package,
  ShoppingCart,
  Wrench,
  Calendar,
  BarChart3,
  UserCheck,
  Award
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Tracking', href: '/tracking', icon: MapPin },
  { name: 'Vehicles', href: '/vehicles', icon: Car },
  { name: 'My Vehicles', href: '/my-vehicles', icon: Car },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Active Services', href: '/services', icon: Package },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingCart },
  { name: 'Workshop', href: '/workshop-management', icon: Wrench },
  { name: 'Maintenance', href: '/maintenance', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Packages', href: '/packages', icon: Package },
  { name: 'Referral Agents', href: '/referral-agents', icon: UserCheck },
  { name: 'Merchant App', href: '/merchant-application', icon: Award },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MapPin className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">FleetIQ</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
