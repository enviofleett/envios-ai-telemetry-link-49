
import { useState, useEffect } from 'react';
import { realAnalyticsService, type RealAnalyticsData } from '@/services/realAnalyticsService';

export const useAnalyticsDashboard = () => {
  const [data, setData] = useState<RealAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const analyticsData = await realAnalyticsService.getAnalyticsData();
      setData(analyticsData);
      setLastUpdated(new Date());
      
      console.log('✅ Real analytics data loaded:', analyticsData);
    } catch (err) {
      console.error('❌ Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    fetchAnalytics();
  };

  // Load data on mount
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refreshData
  };
};
