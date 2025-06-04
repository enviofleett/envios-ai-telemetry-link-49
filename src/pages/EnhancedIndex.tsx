
import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import FleetSummaryCards from '@/components/dashboard/FleetSummaryCards';
import RecentAlerts from '@/components/dashboard/RecentAlerts';
import IntelligentInsights from '@/components/dashboard/IntelligentInsights';
import RealTimeStatus from '@/components/dashboard/RealTimeStatus';

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

      {/* Real-time Status and Fleet Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <RealTimeStatus />
        </div>
        <div className="lg:col-span-3">
          <FleetSummaryCards 
            stats={stats}
            isLoading={isLoading}
          />
        </div>
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
            stats={stats}
            recentAlerts={transformedAlerts}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedIndex;
