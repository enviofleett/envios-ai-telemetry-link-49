
import { supabase } from '@/integrations/supabase/client';

export interface DashboardMetrics {
  vehicles: number;
  users: number;
  workshops: number;
  marketplaceMerchants: number;
  referralAgents: number;
}

export interface MonthlyGrowthData {
  month: string;
  vehicles: number;
  users: number;
  workshops: number;
  marketplaceMerchants: number;
  referralAgents: number;
}

export interface MetricWithGrowth {
  current: number;
  growth: number;
  trend: 'up' | 'down' | 'stable';
}

export const analyticsService = {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Get current counts from all tables
      const [
        { count: vehicleCount },
        { count: userCount },
        { count: workshopCount },
        { count: merchantCount },
        { count: agentCount }
      ] = await Promise.all([
        supabase.from('vehicles').select('*', { count: 'exact', head: true }),
        supabase.from('envio_users').select('*', { count: 'exact', head: true }),
        supabase.from('workshops').select('*', { count: 'exact', head: true }),
        supabase.from('marketplace_merchants').select('*', { count: 'exact', head: true }),
        supabase.from('referral_agents').select('*', { count: 'exact', head: true })
      ]);

      return {
        vehicles: vehicleCount || 0,
        users: userCount || 0,
        workshops: workshopCount || 0,
        marketplaceMerchants: merchantCount || 0,
        referralAgents: agentCount || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      return {
        vehicles: 0,
        users: 0,
        workshops: 0,
        marketplaceMerchants: 0,
        referralAgents: 0
      };
    }
  },

  async getMonthlyGrowthData(): Promise<MonthlyGrowthData[]> {
    try {
      const { data, error } = await supabase
        .from('monthly_analytics')
        .select('*')
        .order('month_year', { ascending: true });

      if (error) throw error;

      // Group data by month
      const monthlyData: { [key: string]: MonthlyGrowthData } = {};

      data?.forEach(record => {
        if (!monthlyData[record.month_year]) {
          monthlyData[record.month_year] = {
            month: record.month_year,
            vehicles: 0,
            users: 0,
            workshops: 0,
            marketplaceMerchants: 0,
            referralAgents: 0
          };
        }

        switch (record.metric_type) {
          case 'vehicles':
            monthlyData[record.month_year].vehicles = record.metric_value;
            break;
          case 'users':
            monthlyData[record.month_year].users = record.metric_value;
            break;
          case 'workshops':
            monthlyData[record.month_year].workshops = record.metric_value;
            break;
          case 'marketplace_merchants':
            monthlyData[record.month_year].marketplaceMerchants = record.metric_value;
            break;
          case 'referral_agents':
            monthlyData[record.month_year].referralAgents = record.metric_value;
            break;
        }
      });

      return Object.values(monthlyData);
    } catch (error) {
      console.error('Error fetching monthly growth data:', error);
      return [];
    }
  },

  calculateGrowth(current: number, previous: number): { growth: number; trend: 'up' | 'down' | 'stable' } {
    if (previous === 0) {
      return { growth: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'stable' };
    }

    const growth = ((current - previous) / previous) * 100;
    const trend = growth > 0 ? 'up' : growth < 0 ? 'down' : 'stable';

    return { growth: Math.round(growth * 100) / 100, trend };
  }
};
