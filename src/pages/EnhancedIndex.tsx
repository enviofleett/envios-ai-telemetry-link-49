
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FleetSummaryCards from '@/components/dashboard/FleetSummaryCards';
import IntelligentInsights from '@/components/dashboard/IntelligentInsights';
import RecentAlerts from '@/components/dashboard/RecentAlerts';
import { useDashboardData } from '@/hooks/useDashboardData';

const EnhancedIndex = () => {
  const { metrics, insights, alerts, isLoading, error, refetch } = useDashboardData();

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error loading dashboard data</div>
          <Button onClick={refetch}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Envio Fleet Intelligence Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time insights for your intelligent fleet management</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Fleet Summary Cards */}
      <FleetSummaryCards metrics={metrics} isLoading={isLoading} />

      {/* Intelligent Insights */}
      <IntelligentInsights insights={insights} isLoading={isLoading} />

      {/* Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentAlerts alerts={alerts} isLoading={isLoading} />
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              View Live Map
            </Button>
            <Button className="w-full justify-start" variant="outline">
              Generate Report
            </Button>
            <Button className="w-full justify-start" variant="outline">
              Manage Alerts
            </Button>
            <Button className="w-full justify-start" variant="outline">
              Fleet Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedIndex;
