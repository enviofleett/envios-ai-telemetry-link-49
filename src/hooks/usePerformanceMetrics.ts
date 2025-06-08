
import { useState, useEffect } from 'react';
import { performanceMonitoringService } from '@/services/performance/PerformanceMonitoringService';
import { enhancedCachingService } from '@/services/performance/EnhancedCachingService';
import { databasePerformanceAnalyzer } from '@/services/performance/DatabasePerformanceAnalyzer';

export interface PerformanceMetricsData {
  sla: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
    availability: number;
  };
  database: {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    errorRate: number;
    connectionStats: any;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    totalSize: number;
    evictions: number;
  };
  alerts: any[];
  trends: Record<string, number>;
}

export const usePerformanceMetrics = (refreshInterval = 30000) => {
  const [metrics, setMetrics] = useState<PerformanceMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      const dashboardData = performanceMonitoringService.getPerformanceDashboardData();
      const dbMetrics = databasePerformanceAnalyzer.getPerformanceMetrics();
      const cacheStats = enhancedCachingService.getStats();
      
      // Transform data to match expected interface
      const transformedMetrics: PerformanceMetricsData = {
        sla: dashboardData.sla,
        database: {
          totalQueries: dbMetrics.totalQueries,
          averageQueryTime: dbMetrics.averageQueryTime,
          slowQueries: dbMetrics.slowQueries.length,
          errorRate: 0, // Calculate from actual data
          connectionStats: {}
        },
        cache: {
          hits: cacheStats.totalHits,
          misses: cacheStats.totalMisses,
          hitRate: cacheStats.hitRate,
          totalSize: cacheStats.totalSize,
          evictions: 0 // Add this to cache stats if needed
        },
        alerts: dashboardData.alerts,
        trends: dashboardData.trends
      };
      
      setMetrics(transformedMetrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    const interval = setInterval(fetchMetrics, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const refreshMetrics = () => {
    setIsLoading(true);
    fetchMetrics();
  };

  const clearCache = () => {
    enhancedCachingService.clear();
    refreshMetrics();
  };

  const acknowledgeAlert = (alertId: string) => {
    return performanceMonitoringService.acknowledgeAlert(alertId);
  };

  const resolveAlert = (alertId: string) => {
    return performanceMonitoringService.resolveAlert(alertId);
  };

  return {
    metrics,
    isLoading,
    lastUpdated,
    refreshMetrics,
    clearCache,
    acknowledgeAlert,
    resolveAlert
  };
};
