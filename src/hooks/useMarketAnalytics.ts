
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MarketAnalyticsData {
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  sales_by_category: { category: string; total_value: number }[];
  sales_by_merchant: { merchant_name: string; total_value: number }[];
}

const fetchMarketAnalytics = async (): Promise<MarketAnalyticsData> => {
  const { data, error } = await supabase.rpc('get_market_analytics');

  if (error) {
    console.error('Error fetching market analytics:', error);
    toast.error('Could not fetch market analytics data.');
    throw new Error('Could not fetch market analytics data.');
  }
  
  return data as unknown as MarketAnalyticsData;
};

export const useMarketAnalytics = () => {
  return useQuery<MarketAnalyticsData, Error>({
    queryKey: ['marketAnalytics'],
    queryFn: fetchMarketAnalytics,
  });
};
