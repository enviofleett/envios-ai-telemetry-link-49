
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Car, 
  Users, 
  Settings,
  Package,
  ShoppingCart,
  Wrench,
  Calendar,
  BarChart3,
  TrendingUp,
  Bell,
  CheckCircle
} from 'lucide-react';

const Index: React.FC = () => {
  const quickActions = [
    {
      title: 'Live Tracking',
      description: 'Monitor your fleet in real-time',
      icon: MapPin,
      href: '/tracking',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Vehicle Management',
      description: 'Manage your vehicle fleet',
      icon: Car,
      href: '/vehicles',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Active Services',
      description: 'Manage your subscriptions',
      icon: Package,
      href: '/services',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Marketplace',
      description: 'Browse products and services',
      icon: ShoppingCart,
      href: '/marketplace',
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Workshop Management',
      description: 'Connect with workshops',
      icon: Wrench,
      href: '/workshop-management',
      color: 'bg-red-50 text-red-600'
    },
    {
      title: 'Maintenance',
      description: 'Schedule and track maintenance',
      icon: Calendar,
      href: '/maintenance',
      color: 'bg-yellow-50 text-yellow-600'
    },
    {
      title: 'Analytics',
      description: 'View detailed reports',
      icon: BarChart3,
      href: '/reports',
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Settings',
      description: 'Configure your system',
      icon: Settings,
      href: '/settings',
      color: 'bg-gray-50 text-gray-600'
    }
  ];

  const recentActivity = [
    { 
      icon: CheckCircle, 
      title: 'Vehicle ABC123 maintenance completed',
      time: '2 hours ago',
      type: 'success'
    },
    { 
      icon: Bell, 
      title: 'New workshop connection approved',
      time: '4 hours ago',
      type: 'info'
    },
    { 
      icon: TrendingUp, 
      title: 'Monthly analytics report generated',
      time: '1 day ago',
      type: 'info'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your fleet management dashboard</p>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${action.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Set Up Your Fleet</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Add your vehicles and start tracking them in real-time.
                </p>
                <Link to="/tracking">
                  <Button size="sm">Start Tracking</Button>
                </Link>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Connect Workshops</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Find and connect with local workshops for maintenance services.
                </p>
                <Link to="/workshop-management">
                  <Button size="sm" variant="outline">Find Workshops</Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
