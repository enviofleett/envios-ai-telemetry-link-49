
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFleetAnalytics } from '@/hooks/useFleetAnalytics';
import FleetMetricsCards from '@/components/analytics/FleetMetricsCards';
import FleetPerformanceChart from '@/components/analytics/FleetPerformanceChart';
import { 
  Car, 
  Activity, 
  MapPin, 
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { fleetMetrics, vehicleAnalytics, isLoading } = useFleetAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fleet Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Real-time overview of your vehicle fleet and operations
        </p>
      </div>

      {/* Fleet Metrics Overview */}
      <FleetMetricsCards metrics={fleetMetrics} isLoading={isLoading} />

      {/* Performance Charts */}
      <FleetPerformanceChart vehicleAnalytics={vehicleAnalytics} isLoading={isLoading} />

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-500" />
              Fleet Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Manage your fleet operations and analytics</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              Live Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Real-time vehicle location tracking</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              Vehicle Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Manage individual vehicle settings</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Manage system users and permissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {fleetMetrics.maintenanceAlerts > 0 ? (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="font-medium">Maintenance Required</p>
                    <p className="text-sm text-gray-600">{fleetMetrics.maintenanceAlerts} vehicles need attention</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">Active</span>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No active alerts - All systems operational
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
