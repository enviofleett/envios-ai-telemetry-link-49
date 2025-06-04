
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  onlineVehicles: number;
  alertVehicles: number;
  totalUsers: number;
  recentImports: number;
}

interface VehiclePosition {
  lat?: number;
  lon?: number;
  updatetime?: string;
}

interface RecentAlert {
  id: string;
  vehicle_name: string;
  alert_type: string;
  timestamp: string;
  location?: string;
}

export const useDashboardData = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Get vehicle statistics
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, is_active, last_position, status');

      if (vehiclesError) throw vehiclesError;

      // Get user count
      const { data: users, error: usersError } = await supabase
        .from('envio_users')
        .select('id');

      if (usersError) throw usersError;

      // Get recent import jobs count
      const { data: recentJobs, error: jobsError } = await supabase
        .from('user_import_jobs')
        .select('id')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (jobsError) throw jobsError;

      const totalVehicles = vehicles?.length || 0;
      const activeVehicles = vehicles?.filter(v => v.is_active).length || 0;
      
      // Check if vehicles are online (last update within 30 minutes)
      const onlineVehicles = vehicles?.filter(v => {
        const position = v.last_position as VehiclePosition | null;
        if (!position?.updatetime) return false;
        return new Date(position.updatetime) > new Date(Date.now() - 30 * 60 * 1000);
      }).length || 0;

      // Count alert vehicles
      const alertVehicles = vehicles?.filter(v => 
        v.status?.toLowerCase().includes('alert') || 
        v.status?.toLowerCase().includes('alarm')
      ).length || 0;

      return {
        totalVehicles,
        activeVehicles,
        onlineVehicles,
        alertVehicles,
        totalUsers: users?.length || 0,
        recentImports: recentJobs?.length || 0
      };
    },
    refetchInterval: 30000, // Fallback refresh every 30 seconds
  });

  // Fetch recent alerts
  const { data: recentAlerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['recent-alerts'],
    queryFn: async (): Promise<RecentAlert[]> => {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, device_name, status, last_position, updated_at')
        .or('status.ilike.%alert%,status.ilike.%alarm%')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return vehicles?.map(vehicle => {
        const position = vehicle.last_position as VehiclePosition | null;
        return {
          id: vehicle.id,
          vehicle_name: vehicle.device_name,
          alert_type: vehicle.status || 'Unknown Alert',
          timestamp: vehicle.updated_at,
          location: position?.lat && position?.lon 
            ? `${position.lat.toFixed(6)}, ${position.lon.toFixed(6)}`
            : undefined
        };
      }) || [];
    },
    refetchInterval: 30000,
  });

  // Set up real-time subscription for dashboard updates
  useEffect(() => {
    console.log('Setting up real-time subscription for dashboard...');
    
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles'
        },
        (payload) => {
          console.log('Real-time dashboard update received:', payload);
          setLastUpdate(new Date());
          // Refetch dashboard data when vehicles are updated
          refetchStats();
          refetchAlerts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'envio_users'
        },
        (payload) => {
          console.log('Real-time user update received:', payload);
          setLastUpdate(new Date());
          refetchStats();
        }
      )
      .subscribe((status) => {
        console.log('Real-time dashboard subscription status:', status);
      });

    return () => {
      console.log('Cleaning up dashboard real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [refetchStats, refetchAlerts]);

  // Update timestamp every second for UI display
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats: stats || {
      totalVehicles: 0,
      activeVehicles: 0,
      onlineVehicles: 0,
      alertVehicles: 0,
      totalUsers: 0,
      recentImports: 0
    },
    recentAlerts: recentAlerts || [],
    isLoading: statsLoading || alertsLoading,
    lastUpdate,
    refetch: () => {
      refetchStats();
      refetchAlerts();
    }
  };
};
