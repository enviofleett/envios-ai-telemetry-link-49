
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Car,
  MapPin,
  BarChart3,
  Settings,
  Users,
  ArrowRight,
  Wrench,
  ShoppingCart
} from 'lucide-react';

interface DashboardNavigationProps {
  metrics?: {
    total: number;
    online: number;
    offline: number;
    alerts: number;
  };
}

const DashboardNavigation: React.FC<DashboardNavigationProps> = ({ metrics }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      title: 'Fleet Management',
      description: 'Comprehensive fleet overview and analytics',
      icon: Car,
      path: '/fleet',
      badge: metrics?.total,
      color: 'bg-blue-500'
    },
    {
      title: 'Live Tracking',
      description: 'Real-time vehicle location and status',
      icon: MapPin,
      path: '/tracking',
      badge: metrics?.online,
      color: 'bg-green-500'
    },
    {
      title: 'Vehicle Management',
      description: 'Manage devices and configurations',
      icon: Car,
      path: '/vehicles',
      color: 'bg-orange-500'
    },
    {
      title: 'Reports & Analytics',
      description: 'Performance insights and reports',
      icon: BarChart3,
      path: '/reports',
      color: 'bg-purple-500'
    },
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: Users,
      path: '/users',
      color: 'bg-indigo-500'
    },
    {
      title: 'Maintenance',
      description: 'Vehicle maintenance and service scheduling',
      icon: Wrench,
      path: '/maintenance',
      color: 'bg-red-500'
    },
    {
      title: 'Workshop Marketplace',
      description: 'Connect with service providers',
      icon: ShoppingCart,
      path: '/marketplace',
      color: 'bg-emerald-500'
    },
    {
      title: 'System Settings',
      description: 'Platform configuration and settings',
      icon: Settings,
      path: '/settings',
      color: 'bg-gray-500'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path, { 
      state: { 
        from: location.pathname,
        preserveFilters: true 
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isCurrentPage = location.pathname === item.path;
        
        return (
          <div
            key={item.path}
            className={`relative overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-lg ${
              isCurrentPage 
                ? 'bg-blue-50 border-blue-200 shadow-md' 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.color} bg-opacity-10`}>
                    <Icon className={`h-5 w-5`} style={{ color: item.color.replace('bg-', '').replace('-500', '') }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
                {item.badge !== undefined && (
                  <Badge variant="outline" className="shrink-0">
                    {item.badge}
                  </Badge>
                )}
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {isCurrentPage ? 'Current page' : 'Navigate to view'}
                </div>
                <Button
                  variant={isCurrentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleNavigation(item.path)}
                  disabled={isCurrentPage}
                  className="flex items-center gap-1"
                >
                  {isCurrentPage ? 'Current' : 'Open'}
                  {!isCurrentPage && <ArrowRight className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardNavigation;
