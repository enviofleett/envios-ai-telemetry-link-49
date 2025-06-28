
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Satellite, MapPin, Route, BarChart3, Users, Settings,
  Monitor, History, FileText, Map, Wifi, WifiOff, 
  CheckCircle, XCircle, AlertTriangle, Activity
} from 'lucide-react';
import { useGPS51Integration } from '@/hooks/useGPS51Integration';

const GPS51Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { isAuthenticated } = useGPS51Integration();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const quickActions = [
    {
      title: 'Live Tracking',
      description: 'Real-time vehicle positions and status',
      icon: MapPin,
      href: '/gps51/tracking',
      color: 'bg-blue-600 hover:bg-blue-700',
      status: 'active'
    },
    {
      title: 'Device Management',
      description: 'Configure and monitor GPS devices',
      icon: Monitor,
      href: '/gps51/devices',
      color: 'bg-green-600 hover:bg-green-700',
      status: 'active'
    },
    {
      title: 'Trip History',
      description: 'Historical routes and journey analysis',
      icon: History,
      href: '/gps51/history',
      color: 'bg-purple-600 hover:bg-purple-700',
      status: 'active'
    },
    {
      title: 'Route Analytics',
      description: 'Performance metrics and insights',
      icon: BarChart3,
      href: '/gps51/analytics',
      color: 'bg-orange-600 hover:bg-orange-700',
      status: 'active'
    },
    {
      title: 'Geofencing',
      description: 'Location-based alerts and boundaries',
      icon: Map,
      href: '/gps51/geofences',
      color: 'bg-teal-600 hover:bg-teal-700',
      status: 'coming-soon'
    },
    {
      title: 'Reports',
      description: 'Generate detailed fleet reports',
      icon: FileText,
      href: '/gps51/reports',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      status: 'active'
    }
  ];

  const systemStatus = [
    { name: 'GPS51 API Connection', status: 'connected', icon: CheckCircle },
    { name: 'Real-time Data Stream', status: 'active', icon: Wifi },
    { name: 'Device Connectivity', status: 'good', icon: CheckCircle },
    { name: 'Data Synchronization', status: 'syncing', icon: AlertTriangle }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Satellite className="h-8 w-8 text-blue-600" />
            GPS51 Live Platform
          </h1>
          <p className="text-gray-400 mt-1">
            Comprehensive fleet tracking and telemetry management system
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/gps51/devices">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <Monitor className="h-4 w-4 mr-2" />
              Manage Devices
            </Button>
          </Link>
          <Link to="/gps51/setup">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <Settings className="h-4 w-4 mr-2" />
              Setup & Config
            </Button>
          </Link>
        </div>
      </div>

      {/* System Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemStatus.map((item) => (
              <div key={item.name} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                <item.icon className={`h-5 w-5 ${
                  item.status === 'connected' || item.status === 'active' || item.status === 'good' 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
                }`} />
                <div>
                  <div className="text-sm font-medium text-white">{item.name}</div>
                  <Badge variant={
                    item.status === 'connected' || item.status === 'active' || item.status === 'good' 
                      ? 'default' 
                      : 'secondary'
                  } className={
                    item.status === 'connected' || item.status === 'active' || item.status === 'good' 
                      ? 'bg-green-600' 
                      : 'bg-yellow-600'
                  }>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action) => (
          <Card key={action.title} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                {action.status === 'coming-soon' && (
                  <Badge variant="secondary" className="bg-gray-600 text-gray-300">Coming Soon</Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
              <p className="text-gray-400 mb-4">{action.description}</p>
              <Link to={action.href}>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  disabled={action.status === 'coming-soon'}
                >
                  {action.status === 'coming-soon' ? 'Coming Soon' : 'Launch'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Authentication Status */}
      {!isAuthenticated && (
        <Card className="border-yellow-600 bg-yellow-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-yellow-300">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">GPS51 Authentication Required</h3>
                <p className="text-sm">Please authenticate with GPS51 to access live tracking features.</p>
              </div>
            </div>
            <Link to="/gps51/setup" className="mt-4 inline-block">
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                <Satellite className="h-4 w-4 mr-2" />
                Authenticate Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GPS51Dashboard;
