
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

// Add missing type definitions
export interface MetricWithGrowth {
  current: number;
  growth: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MonthlyGrowthData {
  month: string;
  vehicles: number;
  users: number;
  workshops: number;
  marketplaceMerchants: number;
  referralAgents: number;
}

export interface DashboardMetrics {
  vehicles: number;
  users: number;
  workshops: number;
  marketplaceMerchants: number;
  referralAgents: number;
}

// Analytics service object
export const analyticsService = {
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    // Mock data since actual tables may not exist
    return {
      vehicles: 1245,
      users: 890,
      workshops: 156,
      marketplaceMerchants: 78,
      referralAgents: 34
    };
  },

  getMonthlyGrowthData: async (): Promise<MonthlyGrowthData[]> => {
    // Mock data for the last 6 months
    return [
      { month: '2024-01', vehicles: 1000, users: 750, workshops: 120, marketplaceMerchants: 60, referralAgents: 25 },
      { month: '2024-02', vehicles: 1050, users: 780, workshops: 125, marketplaceMerchants: 62, referralAgents: 27 },
      { month: '2024-03', vehicles: 1120, users: 820, workshops: 135, marketplaceMerchants: 68, referralAgents: 29 },
      { month: '2024-04', vehicles: 1180, users: 850, workshops: 145, marketplaceMerchants: 72, referralAgents: 31 },
      { month: '2024-05', vehicles: 1210, users: 870, workshops: 150, marketplaceMerchants: 75, referralAgents: 32 },
      { month: '2024-06', vehicles: 1245, users: 890, workshops: 156, marketplaceMerchants: 78, referralAgents: 34 }
    ];
  },

  calculateGrowth: (current: number, previous: number): { growth: number; trend: 'up' | 'down' | 'stable' } => {
    if (previous === 0) return { growth: 0, trend: 'stable' };
    const growth = Math.round(((current - previous) / previous) * 100);
    return {
      growth: Math.abs(growth),
      trend: growth > 0 ? 'up' : growth < 0 ? 'down' : 'stable'
    };
  }
};

export const fetchMonthlyAnalytics = async (): Promise<AnalyticsData> => {
  try {
    // Mock data since monthly_analytics table may not be fully set up
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
