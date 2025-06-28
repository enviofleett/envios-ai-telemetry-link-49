
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGPS51LiveData } from '@/hooks/useGPS51LiveData';
import { Car, MapPin, Activity, Clock, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const GPS51Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const {
    metrics,
    devices,
    isLoading,
    isLiveTracking
  } = useGPS51LiveData({
    refreshInterval: 60000, // 1 minute for dashboard
    enabled: true,
    autoStart: false // Don't auto-start on dashboard
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">GPS51 Dashboard</h1>
            <p className="text-gray-400">Fleet overview and system status</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${isLiveTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              <div className={`h-2 w-2 rounded-full mr-2 ${isLiveTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
              GPS51 {isLiveTracking ? 'Live' : 'Connected'}
            </Badge>
          </div>
        </div>

        {/* Fleet Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Fleet</CardTitle>
                <Car className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-100">{metrics.totalDevices}</div>
                <p className="text-xs text-gray-400">Registered vehicles</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Active</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{metrics.activeDevices}</div>
                <p className="text-xs text-gray-400">Online now</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Moving</CardTitle>
                <Zap className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{metrics.movingDevices}</div>
                <p className="text-xs text-gray-400">In motion</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Parked</CardTitle>
                <MapPin className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">{metrics.parkedDevices}</div>
                <p className="text-xs text-gray-400">Stationary</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Offline</CardTitle>
                <Clock className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-400">{metrics.offlineDevices}</div>
                <p className="text-xs text-gray-400">Not responding</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Live Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Monitor your fleet in real-time with live GPS positions</p>
              <Link to="/gps51/tracking">
                <Button className="w-full">
                  View Live Map
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Device Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Manage GPS51 devices and monitor their status</p>
              <Link to="/gps51/devices">
                <Button variant="outline" className="w-full">
                  Manage Devices
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Trip History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">View detailed trip reports and vehicle history</p>
              <Link to="/gps51/history">
                <Button variant="outline" className="w-full">
                  View History
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {devices.length > 0 ? (
              <div className="space-y-2">
                {devices.slice(0, 5).map(device => (
                  <div key={device.deviceid} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <div className="flex items-center gap-3">
                      <Car className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-100">{device.devicename}</p>
                        <p className="text-sm text-gray-400">Last active: { new Date(device.lastactivetime * 1000).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-gray-300">
                      {device.isfree === 1 ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">
                  {isLoading ? 'Loading device data...' : 'No recent activity found'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GPS51Dashboard;
