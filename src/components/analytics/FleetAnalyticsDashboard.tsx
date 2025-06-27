
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, Car, Navigation, Clock, MapPin } from 'lucide-react';
import type { RealAnalyticsData } from '@/types/gp51-unified';

interface FleetAnalyticsDashboardProps {
  refreshInterval?: number;
}

export const FleetAnalyticsDashboard: React.FC<FleetAnalyticsDashboardProps> = ({ 
  refreshInterval = 30000 
}) => {
  const [analyticsData, setAnalyticsData] = useState<RealAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Mock analytics data with proper structure
      const mockData: RealAnalyticsData = {
        totalUsers: 25,
        activeUsers: 20,
        totalVehicles: 50,
        activeVehicles: 45,
        gp51Status: {
          status: 'healthy',
          lastCheck: new Date(),
          isConnected: true,
          lastPingTime: new Date(),
          tokenValid: true,
          sessionValid: true,
          activeDevices: 45,
          isHealthy: true,
          connectionStatus: 'connected'
        },
        vehicleStatus: {
          total: 50,
          online: 45,
          offline: 5,
          moving: 20,
          parked: 25
        },
        fleetUtilization: {
          activeVehicles: 45,
          totalVehicles: 50,
          utilizationRate: 90
        },
        systemHealth: {
          apiStatus: 'healthy',
          lastUpdate: new Date(),
          responseTime: 150
        },
        recentActivity: [
          {
            type: 'vehicle_online',
            message: 'Vehicle ABC-123 came online',
            timestamp: new Date(),
            vehicleId: 'ABC-123',
            percentageChange: 5.2
          },
          {
            type: 'alert',
            message: 'Speed limit exceeded by Vehicle XYZ-789',
            timestamp: new Date(Date.now() - 300000),
            vehicleId: 'XYZ-789'
          }
        ],
        performance: {
          averageSpeed: 45.5,
          totalDistance: 12500,
          fuelEfficiency: 8.5,
          alertCount: 3
        },
        growth: {
          newUsers: 2,
          newVehicles: 5,
          period: 'This Month',
          percentageChange: 5.2
        },
        sync: {
          importedUsers: 25,
          importedVehicles: 50,
          lastSync: new Date(),
          status: 'success'
        }
      };
      
      setAnalyticsData(mockData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    
    const interval = setInterval(fetchAnalyticsData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={fetchAnalyticsData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Fleet Analytics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated: {analyticsData.systemHealth.lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            onClick={fetchAnalyticsData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.vehicleStatus.total}</div>
            <p className="text-xs text-muted-foreground">Fleet size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Navigation className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analyticsData.vehicleStatus.online}</div>
            <p className="text-xs text-muted-foreground">Active vehicles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moving</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analyticsData.vehicleStatus.moving}</div>
            <p className="text-xs text-muted-foreground">In motion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analyticsData.performance.alertCount}</div>
            <p className="text-xs text-muted-foreground">Active alerts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fleet Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Utilization Rate</span>
                  <span>{analyticsData.fleetUtilization.utilizationRate.toFixed(1)}%</span>
                </div>
                <div className="mt-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${analyticsData.fleetUtilization.utilizationRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Active</span>
                  <div className="font-semibold">{analyticsData.fleetUtilization.activeVehicles}</div>
                </div>
                <div>
                  <span className="text-gray-500">Total</span>
                  <div className="font-semibold">{analyticsData.fleetUtilization.totalVehicles}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">API Status</span>
                <Badge variant={analyticsData.systemHealth.apiStatus === 'healthy' ? "default" : "destructive"}>
                  {analyticsData.systemHealth.apiStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Response Time</span>
                <span className="text-sm">{analyticsData.systemHealth.responseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Growth Rate</span>
                <span className={`text-sm font-medium ${analyticsData.growth.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analyticsData.growth.percentageChange >= 0 ? '+' : ''}{analyticsData.growth.percentageChange}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsData.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 rounded bg-gray-50">
                  <div className={`h-2 w-2 rounded-full ${
                    activity.type === 'vehicle_online' ? 'bg-green-500' :
                    activity.type === 'vehicle_offline' ? 'bg-red-500' :
                    activity.type === 'alert' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetAnalyticsDashboard;
