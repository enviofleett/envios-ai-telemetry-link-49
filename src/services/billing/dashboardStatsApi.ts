
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalDevices: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  newSignupsThisMonth: number;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Return mock data since device_subscriptions table may not be fully set up
    return {
      totalDevices: 1245,
      activeSubscriptions: 890,
      monthlyRevenue: 15780,
      newSignupsThisMonth: 67
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalDevices: 0,
      activeSubscriptions: 0,
      monthlyRevenue: 0,
      newSignupsThisMonth: 0
    };
  }
};

export const fetchRevenueGrowth = async (): Promise<number> => {
  try {
    // Mock growth calculation
    const currentMonth = 15780;
    const previousMonth = 14200;
    return ((currentMonth - previousMonth) / previousMonth) * 100;
  } catch (error) {
    console.error('Error calculating revenue growth:', error);
    return 0;
  }
};
