
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, 
  MapPin, 
  Activity, 
  BarChart3, 
  Shield,
  Navigation,
  Clock,
  Gauge
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { gps51TrackingService } from '@/services/gps51/GPS51TrackingService';
import LiveTrackingDashboard from './LiveTrackingDashboard';
import GPS51AuthenticationForm from './GPS51AuthenticationForm';
import { useGPS51Integration } from '@/hooks/useGPS51Integration';

const FleetManagementPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useGPS51Integration();

  // Fetch fleet summary data
  const {
    data: deviceData,
    isLoading: devicesLoading
  } = useQuery({
    queryKey: ['gps51-devices'],
    queryFn: () => gps51TrackingService.queryDeviceList(),
    enabled: isAuthenticated,
    refetchInterval: 60000
  });

  const {
    data: positionData,
    isLoading: positionsLoading
  } = useQuery({
    queryKey: ['gps51-all-positions'],
    queryFn: () => gps51TrackingService.getLastPositions(),
    enabled: isAuthenticated,
    refetchInterval: 30000
  });

  const devices = deviceData?.devices || [];
  const positions = positionData?.positions || [];

  // Calculate fleet statistics
  const fleetStats = {
    totalDevices: devices.length,
    onlineDevices: devices.filter(d => d.status !== 'offline').length,
    movingDevices: devices.filter(d => d.status === 'moving').length,
    parkedDevices: devices.filter(d => d.status === 'parked').length,
    offlineDevices: devices.filter(d => d.status === 'offline').length,
    positionsReceived: positions.length,
    averageSpeed: positions.length > 0 
      ? Math.round(positions.reduce((sum, p) => sum + p.speed, 0) / positions.length)
      : 0
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              GPS51 Fleet Management
            </h1>
            <p className="text-gray-400 text-lg">
              Advanced fleet tracking and monitoring system
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <GPS51AuthenticationForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3 mb-4">
            <Truck className="h-10 w-10 text-blue-400" />
            GPS51 Fleet Management
          </h1>
          <p className="text-gray-400 text-lg">
            Comprehensive fleet tracking and analytics dashboard
          </p>
        </div>

        {/* Fleet Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Fleet</p>
                  <p className="text-2xl font-bold text-white">{fleetStats.totalDevices}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Online</p>
                  <p className="text-2xl font-bold text-green-400">{fleetStats.onlineDevices}</p>
                </div>
                <Activity className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Moving</p>
                  <p className="text-2xl font-bold text-blue-400">{fleetStats.movingDevices}</p>
                </div>
                <Navigation className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Parked</p>
                  <p className="text-2xl font-bold text-yellow-400">{fleetStats.parkedDevices}</p>
                </div>
                <MapPin className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Offline</p>
                  <p className="text-2xl font-bold text-red-400">{fleetStats.offlineDevices}</p>
                </div>
                <Shield className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Speed</p>
                  <p className="text-2xl font-bold text-purple-400">{fleetStats.averageSpeed}</p>
                  <p className="text-xs text-gray-500">km/h</p>
                </div>
                <Gauge className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Data Points</p>
                  <p className="text-2xl font-bold text-cyan-400">{fleetStats.positionsReceived}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="live-tracking" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full bg-gray-800 border-gray-700">
            <TabsTrigger 
              value="live-tracking" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4 mr-2" />
              Live Tracking
            </TabsTrigger>
            <TabsTrigger 
              value="historical" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Clock className="h-4 w-4 mr-2" />
              Historical Data
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Shield className="h-4 w-4 mr-2" />
              Fleet Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live-tracking" className="space-y-6">
            <LiveTrackingDashboard />
          </TabsContent>

          <TabsContent value="historical" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Historical Data & Playback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-400">
                  <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Historical Tracking Coming Soon</h3>
                  <p>Trip history, route playback, and detailed analytics will be available here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Fleet Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-400">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Advanced Analytics Coming Soon</h3>
                  <p>Comprehensive fleet reports, performance metrics, and insights will be available here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Fleet Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-400">
                  <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Fleet Settings Coming Soon</h3>
                  <p>Device management, geofencing, alerts, and system configuration will be available here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Loading States */}
        {(devicesLoading || positionsLoading || isLoading) && (
          <div className="fixed bottom-4 right-4">
            <Card className="bg-blue-900/20 border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span className="text-sm">
                    {isLoading ? 'Authenticating...' : 
                     devicesLoading ? 'Loading devices...' : 
                     'Updating positions...'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetManagementPage;
