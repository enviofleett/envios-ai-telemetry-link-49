
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Customer {
  id: string;
  name: string;
  email: string;
  total_spent?: number;
  order_count?: number;
}

export interface HighestOrderCustomer extends Customer {
    order_id: string;
    total_amount: number;
}

export interface CustomerAnalyticsData {
  top_spenders: Customer[] | null;
  most_orders: Customer[] | null;
  repeat_customers: Customer[] | null;
  highest_single_orders: HighestOrderCustomer[] | null;
}

export const customerAnalyticsService = {
  async getCustomerAnalytics(): Promise<CustomerAnalyticsData> {
    const { data, error } = await supabase.rpc('get_customer_analytics');

    if (error) {
      console.error('Error fetching customer analytics:', error);
      toast.error('Could not fetch customer analytics data.');
      throw new Error('Could not fetch customer analytics data.');
    }
    
    return data as unknown as CustomerAnalyticsData;
  },
};
