
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SystemHealthMetrics {
  totalVehicles: number;
  activeUsers: number;
  recentActivity: number;
  systemUptime: number;
}

export const useSystemHealth = () => {
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetrics>({
    totalVehicles: 0,
    activeUsers: 0,
    recentActivity: 0,
    systemUptime: 99.9,
  });

  // Fetch system health data using correct column names
  const { data: systemData, isLoading, error, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      console.log('Fetching system health metrics...');
      
      // Get total vehicles count
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, updated_at')
        .order('updated_at', { ascending: false });

      if (vehiclesError) {
        console.error('Error fetching vehicles for health check:', vehiclesError);
        throw vehiclesError;
      }

      // Get active users count
      const { data: usersData, error: usersError } = await supabase
        .from('envio_users')
        .select('id, updated_at')
        .order('updated_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users for health check:', usersError);
        throw usersError;
      }

      const totalVehicles = vehiclesData?.length || 0;
      const activeUsers = usersData?.length || 0;
      
      // Calculate recent activity (vehicles updated in last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentActivity = vehiclesData?.filter(v => v.updated_at > twentyFourHoursAgo).length || 0;

      return {
        totalVehicles,
        activeUsers,
        recentActivity,
        systemUptime: 99.9, // Static value for now
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  useEffect(() => {
    if (systemData) {
      setHealthMetrics(systemData);
    }
  }, [systemData]);

  const getHealthStatus = () => {
    if (isLoading) return 'checking';
    if (error) return 'error';
    if (healthMetrics.systemUptime > 99) return 'healthy';
    if (healthMetrics.systemUptime > 95) return 'warning';
    return 'critical';
  };

  return {
    healthMetrics,
    isLoading,
    error: error?.message || null,
    refetch,
    getHealthStatus,
  };
};
