
import { useState, useEffect } from 'react';
import type { AnalyticsHookReturn, RealAnalyticsData } from '@/types/gp51-unified';
import { createDefaultAnalyticsData } from '@/types/gp51-unified';

export const useAnalyticsDashboard = (): AnalyticsHookReturn => {
  const [analyticsData, setAnalyticsData] = useState<RealAnalyticsData>(createDefaultAnalyticsData());
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [error, setError] = useState<string | undefined>();

  const refreshData = async () => {
    setLoading(true);
    setError(undefined);
    
    try {
      // Simulate data refresh
      const newData = createDefaultAnalyticsData();
      setAnalyticsData(newData);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    analyticsData,
    loading,
    lastUpdated,
    refreshData,
    error
  };
};
