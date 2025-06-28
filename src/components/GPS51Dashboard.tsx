
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity, Zap, Wifi, WifiOff, Users } from 'lucide-react';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51HealthStatus } from '@/types/gp51-unified';

const GPS51Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<GP51HealthStatus | null>(null);
  const [dashboardData, setDashboardData] = useState({
    totalDevices: 0,
    activeDevices: 0,
    onlineDevices: 0,
    groups: 0,
    lastUpdate: new Date()
  });

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const status = await gp51DataService.getHealthStatus();
      setHealthStatus(status);
      
      if (status.isConnected) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Connection check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await gp51DataService.getLiveVehicles();
      
      if (response.success && response.data) {
        setDashboardData({
          totalDevices: response.data.length,
          activeDevices: response.data.filter(d => d.isActive).length,
          onlineDevices: response.data.filter(d => d.isActive).length, // Simplified
          groups: response.groups ? Object.keys(response.groups).length : 0,
          lastUpdate: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy': return <Wifi className="h-4 w-4" />;
      case 'degraded': return <Activity className="h-4 w-4" />;
      case 'unhealthy': return <WifiOff className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GP51 Dashboard</h1>
          <p className="text-gray-600">Real-time vehicle tracking system</p>
        </div>
        <Button onClick={checkConnection} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(healthStatus?.status)}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Badge className={getStatusColor(healthStatus?.status)}>
                {healthStatus?.status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
              {healthStatus?.errorMessage && (
                <p className="text-sm text-red-600">{healthStatus.errorMessage}</p>
              )}
              {healthStatus?.lastCheck && (
                <p className="text-xs text-gray-500">
                  Last checked: {healthStatus.lastCheck.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Active Devices</p>
              <p className="text-2xl font-bold">{healthStatus?.activeDevices || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalDevices}</div>
            <p className="text-xs text-gray-500">Fleet size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              Active Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardData.activeDevices}</div>
            <p className="text-xs text-gray-500">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wifi className="h-4 w-4 text-blue-600" />
              Online Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dashboardData.onlineDevices}</div>
            <p className="text-xs text-gray-500">Connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.groups}</div>
            <p className="text-xs text-gray-500">Device groups</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>System Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Connection Status:</span>
            <Badge className={getStatusColor(healthStatus?.status)}>
              {healthStatus?.status?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Last Update:</span>
            <span className="text-sm text-gray-600">
              {dashboardData.lastUpdate.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Token Valid:</span>
            <Badge variant={healthStatus?.tokenValid ? 'default' : 'destructive'}>
              {healthStatus?.tokenValid ? 'Yes' : 'No'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GPS51Dashboard;
