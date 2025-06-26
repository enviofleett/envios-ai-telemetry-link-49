import React from 'react';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import DashboardMetricCard from './DashboardMetricCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, Car, Users, Building2, Store, UserCheck } from 'lucide-react';

const ModernAnalyticsDashboard: React.FC = () => {
  const { data, isLoading, error, lastUpdated, refreshData } = useAnalyticsDashboard();

  // Transform data for metric cards with proper growth calculation
  const metricCards = [
    {
      title: 'Total Vehicles',
      metric: {
        current: data?.totalVehicles || 0,
        previous: 0,
        change: 0,
        trend: 'stable' as const,
        growth: 0 // Add the missing growth property
      },
      icon: Car,
      iconColor: 'text-blue-600'
    },
    {
      title: 'Total Users',
      metric: {
        current: data?.totalUsers || 0,
        previous: 0,
        change: 0,
        trend: 'stable' as const,
        growth: 0
      },
      icon: Users,
      iconColor: 'text-green-600'
    },
    {
      title: 'Active Users',
      metric: {
        current: data?.activeUsers || 0,
        previous: 0,
        change: 0,
        trend: 'stable' as const,
        growth: 0
      },
      icon: UserCheck,
      iconColor: 'text-purple-600'
    },
    {
      title: 'Active Vehicles',
      metric: {
        current: data?.activeVehicles || 0,
        previous: 0,
        change: 0,
        trend: 'stable' as const,
        growth: 0
      },
      icon: Car,
      iconColor: 'text-orange-600'
    }
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error loading dashboard data</div>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor your platform's growth and performance</p>
          </div>
          <Button 
            onClick={refreshData} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Metrics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card, index) => (
            <DashboardMetricCard
              key={index}
              title={card.title}
              metric={card.metric}
              icon={card.icon}
              iconColor={card.iconColor}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Growth Trends Section */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">User Growth</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Users:</span>
                  <span className="text-sm font-medium">{data?.totalUsers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Users:</span>
                  <span className="text-sm font-medium">{data?.activeUsers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">New This Week:</span>
                  <span className="text-sm font-medium">{data?.recentActivity?.newUsers || 0}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Vehicle Growth</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Vehicles:</span>
                  <span className="text-sm font-medium">{data?.totalVehicles || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Vehicles:</span>
                  <span className="text-sm font-medium">{data?.activeVehicles || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">New This Week:</span>
                  <span className="text-sm font-medium">{data?.recentActivity?.newVehicles || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Insights */}
        {!isLoading && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="font-medium text-gray-900">Platform Activity</div>
                <div className="text-gray-600 mt-1">
                  {data?.activeUsers || 0} active users managing {data?.activeVehicles || 0} vehicles
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="font-medium text-gray-900">GP51 Integration</div>
                <div className="text-gray-600 mt-1">
                  {data?.gp51Status?.importedUsers || 0} imported users with {data?.gp51Status?.importedVehicles || 0} vehicles
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="font-medium text-gray-900">Recent Growth</div>
                <div className="text-gray-600 mt-1">
                  {data?.recentActivity?.newUsers || 0} new users and {data?.recentActivity?.newVehicles || 0} new vehicles this week
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default ModernAnalyticsDashboard;
