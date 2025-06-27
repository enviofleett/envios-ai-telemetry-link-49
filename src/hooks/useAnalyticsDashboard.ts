
import { useState, useEffect, useCallback } from 'react';
import type { RealAnalyticsData, AnalyticsHookReturn } from '@/types/gp51-unified';
import { realAnalyticsService } from '@/services/realAnalyticsService';

export function useAnalyticsDashboard(): AnalyticsHookReturn {
  const [analyticsData, setAnalyticsData] = useState<RealAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await realAnalyticsService.getAnalyticsData(forceRefresh);
      setAnalyticsData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      console.error('Analytics data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    analyticsData,
    data: analyticsData,        // Alias for compatibility
    loading,
    isLoading: loading,         // Alias for compatibility
    error: error || '',
    lastUpdated,
    refreshData
  };
}
