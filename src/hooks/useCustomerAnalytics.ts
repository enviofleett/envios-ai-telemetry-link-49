
import { useQuery } from '@tanstack/react-query';
import { customerAnalyticsService, CustomerAnalyticsData } from '@/services/admin/customerAnalyticsService';
import { toast } from 'sonner';

export const useCustomerAnalytics = () => {
  return useQuery<CustomerAnalyticsData, Error>({
    queryKey: ['customerAnalytics'],
    queryFn: customerAnalyticsService.getCustomerAnalytics,
    onError: (error) => {
        toast.error('Failed to load customer analytics', {
            description: error.message,
        });
    }
  });
};
