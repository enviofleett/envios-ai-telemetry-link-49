
import { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analytics/analyticsService';
import type { FleetMetrics, VehicleAnalytics, AIInsight, AnalyticsReport } from '@/services/analytics/analyticsService';

export interface DateRange {
  from: Date;
  to: Date;
}

export const useFleetAnalytics = () => {
  const [fleetMetrics, setFleetMetrics] = useState<FleetMetrics>({
    totalVehicles: 0,
    activeVehicles: 0,
    onlineVehicles: 0,
    averageUtilization: 0,
    fuelEfficiencyScore: 0,
    maintenanceAlerts: 0,
    performanceScore: 0,
    costPerKm: 0
  });

  const [vehicleAnalytics, setVehicleAnalytics] = useState<VehicleAnalytics[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [analyticsReport, setAnalyticsReport] = useState<AnalyticsReport | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Loading fleet analytics data...');

      const [metrics, analytics, insights, report] = await Promise.all([
        analyticsService.generateFleetMetrics(),
        analyticsService.generateVehicleAnalytics(),
        analyticsService.generateAIInsights(),
        analyticsService.generateAnalyticsReport()
      ]);

      setFleetMetrics(metrics);
      setVehicleAnalytics(analytics);
      setAIInsights(insights);
      setAnalyticsReport(report);

      console.log('Fleet analytics data loaded successfully');
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await loadAnalyticsData();
  };

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      console.log(`Exporting analytics report as ${format}...`);
      // TODO: Implement actual export functionality
      const report = await analyticsService.generateAnalyticsReport();
      
      // For now, just log the data that would be exported
      console.log('Report data to export:', report);
      
      // In a real implementation, you would:
      // 1. Format the data according to the chosen format
      // 2. Generate the file (PDF, Excel, CSV)
      // 3. Trigger download or send via email
      
      return true;
    } catch (error) {
      console.error('Failed to export report:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadAnalyticsData();

    // Set up periodic refresh every 5 minutes
    const interval = setInterval(loadAnalyticsData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dateRange]);

  return {
    fleetMetrics,
    vehicleAnalytics,
    aiInsights,
    analyticsReport,
    dateRange,
    setDateRange,
    isLoading,
    error,
    refreshData,
    exportReport
  };
};
