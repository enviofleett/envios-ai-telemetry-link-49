
import { useQuery } from '@tanstack/react-query';
import { analyticsService, DashboardMetrics, MonthlyGrowthData, MetricWithGrowth } from '@/services/analyticsService';

export const useAnalyticsDashboard = () => {
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics
  } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: analyticsService.getDashboardMetrics,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const {
    data: growthData,
    isLoading: growthLoading,
    error: growthError,
    refetch: refetchGrowth
  } = useQuery({
    queryKey: ['monthly-growth-data'],
    queryFn: analyticsService.getMonthlyGrowthData,
    refetchInterval: 60000, // Refresh every minute
  });

  // Calculate growth percentages for each metric
  const getMetricsWithGrowth = (): Record<keyof DashboardMetrics, MetricWithGrowth> => {
    if (!metrics || !growthData || growthData.length < 2) {
      return {
        vehicles: { current: metrics?.vehicles || 0, growth: 0, trend: 'stable' },
        users: { current: metrics?.users || 0, growth: 0, trend: 'stable' },
        workshops: { current: metrics?.workshops || 0, growth: 0, trend: 'stable' },
        marketplaceMerchants: { current: metrics?.marketplaceMerchants || 0, growth: 0, trend: 'stable' },
        referralAgents: { current: metrics?.referralAgents || 0, growth: 0, trend: 'stable' }
      };
    }

    const currentMonth = growthData[growthData.length - 1];
    const previousMonth = growthData[growthData.length - 2];

    return {
      vehicles: {
        current: metrics.vehicles,
        ...analyticsService.calculateGrowth(currentMonth.vehicles, previousMonth.vehicles)
      },
      users: {
        current: metrics.users,
        ...analyticsService.calculateGrowth(currentMonth.users, previousMonth.users)
      },
      workshops: {
        current: metrics.workshops,
        ...analyticsService.calculateGrowth(currentMonth.workshops, previousMonth.workshops)
      },
      marketplaceMerchants: {
        current: metrics.marketplaceMerchants,
        ...analyticsService.calculateGrowth(currentMonth.marketplaceMerchants, previousMonth.marketplaceMerchants)
      },
      referralAgents: {
        current: metrics.referralAgents,
        ...analyticsService.calculateGrowth(currentMonth.referralAgents, previousMonth.referralAgents)
      }
    };
  };

  return {
    metrics,
    growthData,
    metricsWithGrowth: getMetricsWithGrowth(),
    isLoading: metricsLoading || growthLoading,
    error: metricsError || growthError,
    refetch: () => {
      refetchMetrics();
      refetchGrowth();
    }
  };
};
