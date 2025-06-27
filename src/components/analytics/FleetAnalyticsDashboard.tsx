
import React from 'react';
import type { RealAnalyticsData } from '@/types/gp51-unified';
import DashboardMetricCard from './DashboardMetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FleetAnalyticsDashboardProps {
  analyticsData?: RealAnalyticsData;
}

export const FleetAnalyticsDashboard: React.FC<FleetAnalyticsDashboardProps> = ({ 
  analyticsData 
}) => {
  // Create mock data if none provided
  const mockData: RealAnalyticsData = analyticsData || {
    totalUsers: 150,
    activeUsers: 45,
    totalVehicles: 25,
    activeVehicles: 20,
    vehicleStatus: {
      total: 25,
      online: 20,
      offline: 5,
      moving: 8,
      parked: 12
    },
    fleetUtilization: {
      activeVehicles: 20,
      totalVehicles: 25,
      utilizationRate: 80
    },
    systemHealth: {
      apiStatus: 'healthy',
      lastUpdate: new Date(),
      responseTime: 150
    },
    recentActivity: [
      {
        type: 'vehicle_online',
        message: 'Vehicle ABC123 came online',
        timestamp: new Date(),
        vehicleId: 'ABC123',
        percentageChange: 5.2
      }
    ],
    performance: {
      averageSpeed: 45.2,
      totalDistance: 12750,
      fuelEfficiency: 15.8,
      alertCount: 2
    },
    growth: {
      newUsers: 12,
      newVehicles: 3,
      period: 'This month',
      percentageChange: 8.5
    },
    sync: {
      importedUsers: 150,
      importedVehicles: 25,
      lastSync: new Date(),
      status: 'success'
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardMetricCard
          title="Total Users"
          value={mockData.totalUsers}
          change={mockData.growth.percentageChange}
          icon="users"
        />
        <DashboardMetricCard
          title="Active Users"
          value={mockData.activeUsers}
          change={5.2}
          icon="user-check"
        />
        <DashboardMetricCard
          title="Total Vehicles"
          value={mockData.totalVehicles}
          change={3.1}
          icon="car"
        />
        <DashboardMetricCard
          title="Active Vehicles"
          value={mockData.activeVehicles}
          change={2.8}
          icon="activity"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Vehicle Status</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Online:</span>
                  <span>{mockData.vehicleStatus.online}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Offline:</span>
                  <span>{mockData.vehicleStatus.offline}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Moving:</span>
                  <span>{mockData.vehicleStatus.moving}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">System Health</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>API Status:</span>
                  <span className="capitalize">{mockData.systemHealth.apiStatus}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Response Time:</span>
                  <span>{mockData.systemHealth.responseTime}ms</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetAnalyticsDashboard;
