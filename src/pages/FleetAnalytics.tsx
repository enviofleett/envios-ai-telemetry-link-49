
import React from 'react';
import { RefreshCw, Calendar, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFleetAnalytics } from '@/hooks/useFleetAnalytics';
import FleetMetricsCards from '@/components/analytics/FleetMetricsCards';
import FleetPerformanceChart from '@/components/analytics/FleetPerformanceChart';
import VehicleAnalyticsTable from '@/components/analytics/VehicleAnalyticsTable';
import RealTimeAlerts from '@/components/analytics/RealTimeAlerts';

const FleetAnalytics = () => {
  const {
    fleetMetrics,
    vehicleAnalytics,
    dateRange,
    setDateRange,
    isLoading,
    refreshData
  } = useFleetAnalytics();

  const handleExportReport = () => {
    // TODO: Implement report export functionality
    console.log('Exporting fleet analytics report...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Analytics</h1>
          <p className="text-gray-600 mt-1">
            AI-powered insights and performance analytics for your fleet
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Fleet Metrics Overview */}
      <FleetMetricsCards metrics={fleetMetrics} isLoading={isLoading} />

      {/* Performance Charts */}
      <FleetPerformanceChart vehicleAnalytics={vehicleAnalytics} isLoading={isLoading} />

      {/* Real-Time Alerts and Vehicle Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VehicleAnalyticsTable vehicleAnalytics={vehicleAnalytics} isLoading={isLoading} />
        </div>
        <div>
          <RealTimeAlerts vehicleAnalytics={vehicleAnalytics} />
        </div>
      </div>

      {/* AI Insights Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            🤖 AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Fleet Optimization Opportunity</div>
                <div className="text-sm text-gray-600">
                  Vehicles DEV-001 and DEV-003 show 15% below-average utilization. 
                  Consider route optimization or redistributing workload.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Fuel Efficiency Trend</div>
                <div className="text-sm text-gray-600">
                  Your fleet's fuel efficiency improved by 8% this month. 
                  Driver training programs are showing positive results.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Maintenance Prediction</div>
                <div className="text-sm text-gray-600">
                  3 vehicles are approaching their optimal maintenance window based on usage patterns. 
                  Schedule maintenance to prevent breakdowns.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetAnalytics;
