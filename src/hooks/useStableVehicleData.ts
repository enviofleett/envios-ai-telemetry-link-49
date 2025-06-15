import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

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
  alerts: number;
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
          query = query.or(`gp51_device_id.ilike.%${search}%,name.ilike.%${search}%`);
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
          // is_active is no longer in the DB, defaulting to true for now
          const isActive = true;
          
          return {
            id: vehicle.id || vehicle.gp51_device_id || '',
            device_id: vehicle.gp51_device_id || '',
            device_name: vehicle.name || 'Unknown Vehicle',
            user_id: vehicle.user_id,
            sim_number: vehicle.sim_number,
            created_at: vehicle.created_at,
            updated_at: vehicle.updated_at,
            last_position: undefined, // No longer in DB
            status: isActive ? 'online' : 'offline', // Simplified status
            lastUpdate: new Date(vehicle.updated_at || vehicle.created_at),
            alerts: [],
            isOnline: isActive,
            isMoving: false, // No speed data from DB
            is_active: isActive,
            vehicleName: vehicle.name || 'Unknown Vehicle',
          };
        });

        // Apply status filter
        const filteredVehicles = transformedVehicles.filter(vehicle => {
          if (status === 'all') return true;
          if (status === 'online') return vehicle.isOnline;
          if (status === 'offline') return !vehicle.isOnline;
          if (status === 'alerts') return (vehicle.alerts || []).length > 0;
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
    const offline = total - online;
    const idle = 0; // Cannot be determined from DB data
    const maintenance = 0;
    const alerts = vehicles.filter(v => (v.alerts || []).length > 0).length;

    return { total, online, idle, offline, maintenance, alerts };
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
