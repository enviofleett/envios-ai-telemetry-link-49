
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/services/unifiedVehicleData';

interface UseStableVehicleDataOptions {
  refetchInterval?: number;
}

interface VehicleMetrics {
  total: number;
  online: number;
  idle: number;
  offline: number;
  maintenance: number;
}

export const useStableVehicleData = (options: UseStableVehicleDataOptions = {}) => {
  const { refetchInterval = 30000 } = options;
  const [error, setError] = useState<string | null>(null);

  const { data: vehicles = [], isLoading, isRefreshing, refetch } = useQuery({
    queryKey: ['stable-vehicle-data'],
    queryFn: async () => {
      try {
        setError(null);
        console.log('Fetching vehicle data from Supabase...');
        
        const { data, error: supabaseError } = await supabase
          .from('vehicles')
          .select('*')
          .order('updated_at', { ascending: false });

        if (supabaseError) {
          throw new Error(`Supabase error: ${supabaseError.message}`);
        }

        if (!data) {
          throw new Error('No data received from Supabase');
        }

        // Transform Supabase data to VehicleData format
        const transformedVehicles: VehicleData[] = data.map(vehicle => ({
          deviceId: vehicle.device_id || '',
          deviceName: vehicle.device_name || 'Unknown Vehicle',
          lastPosition: vehicle.last_position ? {
            lat: vehicle.last_position.lat || 0,
            lon: vehicle.last_position.lng || vehicle.last_position.lon || 0,
            speed: vehicle.last_position.speed || 0,
            course: vehicle.last_position.course || 0,
            timestamp: new Date(vehicle.last_position.timestamp || new Date()),
            statusText: vehicle.last_position.statusText || 'Unknown'
          } : null,
          status: vehicle.is_active ? 'online' : 'offline',
          lastUpdate: new Date(vehicle.updated_at || vehicle.created_at),
          alerts: []
        }));

        console.log(`Successfully fetched ${transformedVehicles.length} vehicles`);
        return transformedVehicles;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error fetching vehicle data:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    refetchInterval,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Calculate metrics
  const metrics: VehicleMetrics = useMemo(() => {
    const total = vehicles.length;
    const online = vehicles.filter(v => v.status === 'online').length;
    const offline = vehicles.filter(v => v.status === 'offline').length;
    const idle = vehicles.filter(v => {
      if (!v.lastPosition?.timestamp) return false;
      const lastUpdate = new Date(v.lastPosition.timestamp);
      const now = new Date();
      const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
      return minutesSinceUpdate > 5 && minutesSinceUpdate <= 30;
    }).length;
    const maintenance = 0; // No maintenance status in current data

    return { total, online, idle, offline, maintenance };
  }, [vehicles]);

  const forceRefresh = async () => {
    await refetch();
  };

  const getVehicleById = (deviceId: string) => {
    return vehicles.find(v => v.deviceId === deviceId);
  };

  return {
    vehicles,
    allVehicles: vehicles,
    metrics,
    isLoading,
    isRefreshing,
    error,
    forceRefresh,
    getVehicleById
  };
};
