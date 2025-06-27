
import { useState, useEffect, useCallback } from 'react';
import type { RealAnalyticsData } from '@/types/gp51-unified';
import { realAnalyticsService } from '@/services/realAnalyticsService';

export function useAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<RealAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await realAnalyticsService.getAnalyticsData(forceRefresh);
      setAnalyticsData(data);
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
    loading,
    error,
    refreshData
  };
}
