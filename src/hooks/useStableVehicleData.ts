
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/services/unifiedVehicleData';

interface UseStableVehicleDataOptions {
  refetchInterval?: number;
  search?: string;
  status?: 'all' | 'online' | 'offline' | 'alerts';
}

interface VehicleMetrics {
  total: number;
  online: number;
  idle: number;
  offline: number;
  maintenance: number;
}

// Type guard for position data from Supabase JSONB
const isValidPosition = (data: any): data is {
  lat: number;
  lng?: number;
  lon?: number;
  speed: number;
  course: number;
  timestamp: string;
  statusText: string;
} => {
  return data && 
         typeof data === 'object' && 
         typeof data.lat === 'number' && 
         (typeof data.lng === 'number' || typeof data.lon === 'number');
};

export const useStableVehicleData = (options: UseStableVehicleDataOptions = {}) => {
  const { refetchInterval = 30000, search = '', status = 'all' } = options;
  const [error, setError] = useState<string | null>(null);

  const { data: vehicles = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['stable-vehicle-data', search, status],
    queryFn: async () => {
      try {
        setError(null);
        console.log('Fetching vehicle data from Supabase...');
        
        let query = supabase
          .from('vehicles')
          .select('*')
          .order('updated_at', { ascending: false });

        // Apply search filter if provided
        if (search) {
          query = query.or(`device_id.ilike.%${search}%,device_name.ilike.%${search}%`);
        }

        const { data, error: supabaseError } = await query;

        if (supabaseError) {
          throw new Error(`Supabase error: ${supabaseError.message}`);
        }

        if (!data) {
          throw new Error('No data received from Supabase');
        }

        // Transform Supabase data to VehicleData format
        const transformedVehicles: VehicleData[] = data.map(vehicle => {
          let last_position = null;
          
          // Safely handle JSONB position data
          if (vehicle.last_position && isValidPosition(vehicle.last_position)) {
            const pos = vehicle.last_position;
            last_position = {
              lat: pos.lat,
              lng: pos.lng || pos.lon || 0,
              speed: pos.speed || 0,
              course: pos.course || 0,
              timestamp: pos.timestamp || new Date().toISOString()
            };
          }

          const isActive = vehicle.is_active || false;
          
          return {
            id: vehicle.id || vehicle.device_id || '',
            device_id: vehicle.device_id || '',
            device_name: vehicle.device_name || 'Unknown Vehicle',
            last_position,
            status: isActive ? 'online' : 'offline',
            lastUpdate: new Date(vehicle.updated_at || vehicle.created_at),
            alerts: [],
            isOnline: isActive,
            isMoving: last_position ? last_position.speed > 0 : false,
            is_active: isActive,
            // Legacy compatibility properties
            deviceId: vehicle.device_id || '',
            deviceName: vehicle.device_name || 'Unknown Vehicle',
            lastPosition: last_position
          } as VehicleData;
        });

        // Apply status filter
        const filteredVehicles = transformedVehicles.filter(vehicle => {
          if (status === 'all') return true;
          if (status === 'online') return vehicle.isOnline;
          if (status === 'offline') return !vehicle.isOnline;
          if (status === 'alerts') return vehicle.alerts.length > 0;
          return true;
        });

        console.log(`Successfully fetched ${filteredVehicles.length} vehicles`);
        return filteredVehicles;
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
      if (!v.last_position?.timestamp) return false;
      const lastUpdate = new Date(v.last_position.timestamp);
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
    return vehicles.find(v => v.device_id === deviceId);
  };

  const setFilters = (filters: any) => {
    // Implementation for filter setting if needed
    console.log('Setting filters:', filters);
  };

  return {
    vehicles,
    allVehicles: vehicles,
    metrics,
    isLoading,
    isRefreshing: isFetching,
    error,
    forceRefresh,
    refetch,
    getVehicleById,
    setFilters
  };
};
