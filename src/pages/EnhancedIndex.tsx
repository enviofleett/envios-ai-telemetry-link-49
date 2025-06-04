
import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import FleetSummaryCards from '@/components/dashboard/FleetSummaryCards';
import RecentAlerts from '@/components/dashboard/RecentAlerts';
import IntelligentInsights from '@/components/dashboard/IntelligentInsights';
import RealTimeStatus from '@/components/dashboard/RealTimeStatus';
import PollingControls from '@/components/dashboard/PollingControls';
import SystemHealth from '@/components/dashboard/SystemHealth';

const EnhancedIndex = () => {
  const { stats, recentAlerts, isLoading, lastUpdate } = useDashboardData();

  // Transform recent alerts to match the expected Alert interface
  const transformedAlerts = recentAlerts.map(alert => ({
    id: alert.id,
    deviceName: alert.vehicle_name,
    deviceId: alert.id,
    alarmType: alert.alert_type,
    description: alert.alert_type,
    severity: 'medium' as const,
    timestamp: alert.timestamp,
    location: alert.location
  }));

  // Transform stats to match FleetSummaryCards expected metrics prop
  const fleetMetrics = {
    totalVehicles: stats.totalVehicles,
    activeVehicles: stats.activeVehicles,
    onlineVehicles: stats.onlineVehicles,
    alertVehicles: stats.alertVehicles
  };

  // Create mock insights data for IntelligentInsights component
  const mockInsights = {
    fuelEfficiencyTrend: [
      { date: '2024-01-01', efficiency: 85 },
      { date: '2024-01-02', efficiency: 87 },
      { date: '2024-01-03', efficiency: 83 },
      { date: '2024-01-04', efficiency: 89 },
      { date: '2024-01-05', efficiency: 91 }
    ],
    maintenanceAlerts: [
      { vehicleId: 'V001', type: 'Oil Change', dueIn: '3 days' },
      { vehicleId: 'V002', type: 'Tire Rotation', dueIn: '1 week' }
    ],
    driverBehavior: {
      fleetScore: 78,
      topIssues: [
        { issue: 'Hard Braking', percentage: 15 },
        { issue: 'Speeding', percentage: 12 }
      ]
    },
    anomalies: [
      { vehicleId: 'V003', description: 'Unusual route pattern', severity: 'medium' },
      { vehicleId: 'V004', description: 'Extended idle time', severity: 'low' }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time insights and monitoring for your intelligent fleet
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* System Health and Controls Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SystemHealth />
        </div>
        <div className="lg:col-span-1">
          <PollingControls />
        </div>
        <div className="lg:col-span-1">
          <RealTimeStatus />
        </div>
      </div>

      {/* Fleet Summary */}
      <div className="grid grid-cols-1">
        <FleetSummaryCards 
          metrics={fleetMetrics}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <div className="lg:col-span-2">
          <RecentAlerts 
            alerts={transformedAlerts}
            isLoading={isLoading}
          />
        </div>

        {/* Intelligent Insights */}
        <div className="lg:col-span-1">
          <IntelligentInsights 
            insights={mockInsights}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedIndex;
