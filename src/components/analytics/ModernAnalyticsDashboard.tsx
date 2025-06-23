
import React from 'react';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import DashboardMetricCard from './DashboardMetricCard';
import GrowthTrendsChart from './GrowthTrendsChart';
import { Button } from '@/components/ui/button';
import { RefreshCw, Car, Users, Building2, Store, UserCheck } from 'lucide-react';

const ModernAnalyticsDashboard: React.FC = () => {
  const { metricsWithGrowth, growthData, isLoading, error, refetch } = useAnalyticsDashboard();

  const metricCards = [
    {
      title: 'Total Vehicles',
      metric: metricsWithGrowth.vehicles,
      icon: Car,
      iconColor: 'text-blue-600'
    },
    {
      title: 'Total Users',
      metric: metricsWithGrowth.users,
      icon: Users,
      iconColor: 'text-green-600'
    },
    {
      title: 'Total Workshops',
      metric: metricsWithGrowth.workshops,
      icon: Building2,
      iconColor: 'text-orange-600'
    },
    {
      title: 'Marketplace Merchants',
      metric: metricsWithGrowth.marketplaceMerchants,
      icon: Store,
      iconColor: 'text-purple-600'
    },
    {
      title: 'Referral Agents',
      metric: metricsWithGrowth.referralAgents,
      icon: UserCheck,
      iconColor: 'text-red-600'
    }
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error loading dashboard data</div>
          <Button onClick={refetch} variant="outline">
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
            onClick={refetch} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Metrics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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

        {/* Growth Trends Chart */}
        <GrowthTrendsChart data={growthData || []} isLoading={isLoading} />

        {/* Summary Insights */}
        {!isLoading && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="font-medium text-gray-900">Platform Activity</div>
                <div className="text-gray-600 mt-1">
                  {metricsWithGrowth.users.current} active users managing {metricsWithGrowth.vehicles.current} vehicles
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="font-medium text-gray-900">Service Network</div>
                <div className="text-gray-600 mt-1">
                  {metricsWithGrowth.workshops.current} workshops and {metricsWithGrowth.marketplaceMerchants.current} merchants available
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="font-medium text-gray-900">Growth Network</div>
                <div className="text-gray-600 mt-1">
                  {metricsWithGrowth.referralAgents.current} referral agents driving expansion
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernAnalyticsDashboard;
