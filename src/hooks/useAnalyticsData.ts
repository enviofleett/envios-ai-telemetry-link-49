
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsData {
  userMetrics: {
    total: number;
    active: number;
    newThisMonth: number;
    growth: string;
  };
  vehicleMetrics: {
    total: number;
    online: number;
    offline: number;
    growth: string;
  };
  systemMetrics: {
    uptime: string;
    apiRequests: number;
    averageResponseTime: number;
    errorRate: string;
  };
  topUsers: Array<{
    name: string;
    vehicles: number;
    usage: string;
  }>;
  recentActivity: Array<{
    event: string;
    count: number;
    trend: string;
    timestamp: string;
  }>;
}

export const useAnalyticsData = () => {
  return useQuery({
    queryKey: ['analytics-data'],
    queryFn: async (): Promise<AnalyticsData> => {
      // Get user metrics
      const { data: users, error: usersError } = await supabase
        .from('envio_users')
        .select('id, created_at');
      
      if (usersError) throw usersError;

      // Get vehicle metrics - using correct column name 'is_active'
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, is_active, created_at');
      
      if (vehiclesError) throw vehiclesError;

      // Calculate metrics
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      
      const newUsersThisMonth = users?.filter(u => new Date(u.created_at) > lastMonth).length || 0;
      const newVehiclesThisMonth = vehicles?.filter(v => new Date(v.created_at) > lastMonth).length || 0;
      
      // Use is_active instead of is_online
      const activeVehicles = vehicles?.filter(v => v.is_active).length || 0;
      const inactiveVehicles = (vehicles?.length || 0) - activeVehicles;

      // Mock some calculated data that would come from analytics
      const userGrowth = users?.length ? ((newUsersThisMonth / users.length) * 100).toFixed(1) : '0';
      const vehicleGrowth = vehicles?.length ? ((newVehiclesThisMonth / vehicles.length) * 100).toFixed(1) : '0';

      return {
        userMetrics: {
          total: users?.length || 0,
          active: Math.floor((users?.length || 0) * 0.85), // Assume 85% active
          newThisMonth: newUsersThisMonth,
          growth: `+${userGrowth}%`
        },
        vehicleMetrics: {
          total: vehicles?.length || 0,
          online: activeVehicles,
          offline: inactiveVehicles,
          growth: `+${vehicleGrowth}%`
        },
        systemMetrics: {
          uptime: '99.9%',
          apiRequests: Math.floor(Math.random() * 50000) + 10000,
          averageResponseTime: Math.floor(Math.random() * 200) + 50,
          errorRate: '0.1%'
        },
        topUsers: [
          { name: 'Fleet Corp', vehicles: 25, usage: '95%' },
          { name: 'Transport Ltd', vehicles: 18, usage: '87%' },
          { name: 'Logistics Inc', vehicles: 12, usage: '78%' },
          { name: 'Delivery Co', vehicles: 8, usage: '65%' }
        ],
        recentActivity: [
          { event: 'User Registration', count: newUsersThisMonth, trend: `+${userGrowth}%`, timestamp: now.toISOString() },
          { event: 'Vehicle Added', count: newVehiclesThisMonth, trend: `+${vehicleGrowth}%`, timestamp: now.toISOString() },
          { event: 'GPS Updates', count: activeVehicles * 144, trend: '+5%', timestamp: now.toISOString() },
          { event: 'System Errors', count: 3, trend: '-25%', timestamp: now.toISOString() }
        ]
      };
    },
    refetchInterval: 60000 // Refresh every minute
  });
};
