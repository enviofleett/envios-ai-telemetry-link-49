
import React, { useState, useEffect, useCallback } from 'react';
import { GP51UnifiedDataService } from '@/services/gp51/GP51UnifiedDataService';
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
  const [dataService] = useState(() => new GP51UnifiedDataService());

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dataService.getAnalyticsData();
      setAnalyticsData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  useEffect(() => {
    fetchAnalyticsData();
    
    const interval = setInterval(fetchAnalyticsData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAnalyticsData, refreshInterval]);

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4">
              <button
                onClick={fetchAnalyticsData}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Fleet Analytics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated: {analyticsData.systemHealth.lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Vehicle Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.vehicleStatus.total}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Vehicles</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData.vehicleStatus.online}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Online Vehicles</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-yellow-600">
                  {analyticsData.vehicleStatus.moving}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Moving Vehicles</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-gray-600">
                  {analyticsData.vehicleStatus.parked}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Parked Vehicles</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Utilization & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Fleet Utilization</h3>
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
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Growth Rate</span>
                <span className={`text-sm font-medium ${analyticsData.recentActivity.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analyticsData.recentActivity.percentageChange >= 0 ? '+' : ''}{analyticsData.recentActivity.percentageChange}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Average Speed</span>
                <span className="text-sm font-medium">{analyticsData.performance.averageSpeed.toFixed(1)} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Distance</span>
                <span className="text-sm font-medium">{(analyticsData.performance.totalDistance / 1000).toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Active Alerts</span>
                <span className="text-sm font-medium text-red-600">{analyticsData.performance.alertCount}</span>
              </div>
              {analyticsData.performance.fuelEfficiency && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Fuel Efficiency</span>
                  <span className="text-sm font-medium">{analyticsData.performance.fuelEfficiency} L/100km</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">API Status</span>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                analyticsData.systemHealth.apiStatus === 'healthy' ? 'bg-green-100 text-green-800' :
                analyticsData.systemHealth.apiStatus === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {analyticsData.systemHealth.apiStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Connected Vehicles</span>
              <span className="text-sm font-medium">{analyticsData.gp51Status.importedVehicles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Last Update</span>
              <span className="text-sm font-medium">
                {analyticsData.gp51Status.lastSync.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Response Time</span>
              <span className="text-sm font-medium">{analyticsData.systemHealth.responseTime}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetAnalyticsDashboard;
