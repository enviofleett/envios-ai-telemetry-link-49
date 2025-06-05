
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AnalyticsHeader from './analytics/AnalyticsHeader';
import AnalyticsKeyMetrics from './analytics/AnalyticsKeyMetrics';
import PopularActionsChart from './analytics/PopularActionsChart';
import PerformanceChart from './analytics/PerformanceChart';
import ZoomDistributionChart from './analytics/ZoomDistributionChart';
import UsageSummaryCard from './analytics/UsageSummaryCard';
import LoadingState from './analytics/LoadingState';
import EmptyState from './analytics/EmptyState';
import type { AnalyticsData } from './analytics/types';

const MapAnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('7d');

  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['map-analytics', dateRange],
    queryFn: async (): Promise<AnalyticsData> => {
      const { data, error } = await supabase.functions.invoke('map-analytics', {
        body: { dateRange }
      });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!analyticsData) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <AnalyticsHeader 
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onRefresh={handleRefresh}
      />
      
      <AnalyticsKeyMetrics data={analyticsData} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PopularActionsChart data={analyticsData.popularActions} />
        <ZoomDistributionChart data={analyticsData.zoomDistribution} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart data={analyticsData.performanceMetrics} />
        <UsageSummaryCard 
          popularActions={analyticsData.popularActions}
          totalEvents={analyticsData.totalEvents}
        />
      </div>
    </div>
  );
};

export default MapAnalyticsDashboard;
