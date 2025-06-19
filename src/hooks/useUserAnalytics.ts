
import { useQuery } from '@tanstack/react-query';
import { userAnalyticsService } from '@/services/analytics/userAnalyticsService';
import type { UserVehicleAnalytics, FleetAnalytics } from '@/services/analytics/userAnalyticsService';

export const useUserAnalytics = (userId: string) => {
  return useQuery({
    queryKey: ['user-analytics', userId],
    queryFn: () => userAnalyticsService.getUserVehicleAnalytics(userId),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
    enabled: !!userId, // Only run query if userId is provided
  });
};

export const useFleetAnalytics = () => {
  return useQuery({
    queryKey: ['fleet-analytics'],
    queryFn: () => userAnalyticsService.getFleetAnalytics(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
  });
};
