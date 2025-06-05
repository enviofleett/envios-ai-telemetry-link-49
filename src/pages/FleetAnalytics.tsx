
import React from 'react';
import { RefreshCw, Calendar, Download, Settings, TrendingUp, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFleetAnalytics } from '@/hooks/useFleetAnalytics';
import FleetMetricsCards from '@/components/analytics/FleetMetricsCards';
import FleetPerformanceChart from '@/components/analytics/FleetPerformanceChart';
import VehicleAnalyticsTable from '@/components/analytics/VehicleAnalyticsTable';
import RealTimeAlerts from '@/components/analytics/RealTimeAlerts';

const FleetAnalytics = () => {
  const {
    fleetMetrics,
    vehicleAnalytics,
    aiInsights,
    analyticsReport,
    dateRange,
    setDateRange,
    isLoading,
    refreshData,
    exportReport
  } = useFleetAnalytics();

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      await exportReport(format);
      console.log(`Report exported as ${format}`);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
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
            onClick={() => handleExportReport('pdf')}
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
            <Bot className="h-5 w-5 text-blue-600" />
            AI-Powered Insights
            <Badge variant="secondary">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-blue-100 rounded-lg"></div>
                ))}
              </div>
            ) : aiInsights.length > 0 ? (
              aiInsights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    insight.priority === 'high' ? 'bg-red-500' :
                    insight.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm">{insight.title}</div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={insight.priority === 'high' ? 'destructive' : 
                                  insight.priority === 'medium' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {insight.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {insight.description}
                    </div>
                    <div className="text-sm font-medium text-blue-700">
                      💡 {insight.recommendation}
                    </div>
                    {insight.potentialSavings && (
                      <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Potential savings: ${insight.potentialSavings.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Bot className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-600 mb-1">
                  AI Analysis in Progress
                </h3>
                <p className="text-xs text-gray-500">
                  Analyzing your fleet data to generate insights...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetAnalytics;
