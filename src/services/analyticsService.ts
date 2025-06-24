
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsData {
  userGrowth: { month: string; users: number; vehicles: number }[];
  revenueMetrics: { month: string; revenue: number; subscriptions: number }[];
  deviceMetrics: { month: string; activeDevices: number; newDevices: number }[];
  subscriptionMetrics: { month: string; newSubscriptions: number; churnRate: number }[];
  systemHealth: { month: string; uptime: number; errors: number }[];
}

export interface MonthlyMetric {
  month_year: string;
  metric_type: string;
  metric_value: number;
}

export const fetchMonthlyAnalytics = async (): Promise<AnalyticsData> => {
  try {
    // For now, return mock data since monthly_analytics table may not be fully set up
    const mockData: AnalyticsData = {
      userGrowth: [
        { month: '2024-01', users: 100, vehicles: 250 },
        { month: '2024-02', users: 120, vehicles: 300 },
        { month: '2024-03', users: 145, vehicles: 360 },
        { month: '2024-04', users: 180, vehicles: 420 },
        { month: '2024-05', users: 200, vehicles: 480 },
        { month: '2024-06', users: 235, vehicles: 550 }
      ],
      revenueMetrics: [
        { month: '2024-01', revenue: 5000, subscriptions: 50 },
        { month: '2024-02', revenue: 6200, subscriptions: 62 },
        { month: '2024-03', revenue: 7100, subscriptions: 71 },
        { month: '2024-04', revenue: 8500, subscriptions: 85 },
        { month: '2024-05', revenue: 9200, subscriptions: 92 },
        { month: '2024-06', revenue: 10800, subscriptions: 108 }
      ],
      deviceMetrics: [
        { month: '2024-01', activeDevices: 220, newDevices: 45 },
        { month: '2024-02', activeDevices: 270, newDevices: 50 },
        { month: '2024-03', activeDevices: 315, newDevices: 45 },
        { month: '2024-04', activeDevices: 370, newDevices: 55 },
        { month: '2024-05', activeDevices: 425, newDevices: 55 },
        { month: '2024-06', activeDevices: 485, newDevices: 60 }
      ],
      subscriptionMetrics: [
        { month: '2024-01', newSubscriptions: 12, churnRate: 5.2 },
        { month: '2024-02', newSubscriptions: 15, churnRate: 4.8 },
        { month: '2024-03', newSubscriptions: 18, churnRate: 4.1 },
        { month: '2024-04', newSubscriptions: 22, churnRate: 3.9 },
        { month: '2024-05', newSubscriptions: 25, churnRate: 3.5 },
        { month: '2024-06', newSubscriptions: 28, churnRate: 3.2 }
      ],
      systemHealth: [
        { month: '2024-01', uptime: 99.2, errors: 15 },
        { month: '2024-02', uptime: 99.5, errors: 12 },
        { month: '2024-03', uptime: 99.8, errors: 8 },
        { month: '2024-04', uptime: 99.7, errors: 10 },
        { month: '2024-05', uptime: 99.9, errors: 5 },
        { month: '2024-06', uptime: 99.8, errors: 7 }
      ]
    };

    return mockData;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    // Return empty data structure on error
    return {
      userGrowth: [],
      revenueMetrics: [],
      deviceMetrics: [],
      subscriptionMetrics: [],
      systemHealth: []
    };
  }
};

export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const getLatestMetric = (data: { month: string; [key: string]: any }[], metricKey: string) => {
  if (data.length === 0) return 0;
  return data[data.length - 1][metricKey] || 0;
};
