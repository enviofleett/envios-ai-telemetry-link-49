
import { useQuery } from '@tanstack/react-query';
import { customerAnalyticsService, CustomerAnalyticsData } from '@/services/admin/customerAnalyticsService';

export const useCustomerAnalytics = () => {
  return useQuery<CustomerAnalyticsData, Error>({
    queryKey: ['customerAnalytics'],
    queryFn: customerAnalyticsService.getCustomerAnalytics,
  });
};
