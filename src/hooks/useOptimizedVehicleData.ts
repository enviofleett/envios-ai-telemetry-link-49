
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

interface UseOptimizedVehicleDataOptions {
  refetchInterval?: number;
  enabled?: boolean;
}

export function useOptimizedVehicleData(options: UseOptimizedVehicleDataOptions = {}) {
  const { refetchInterval = 30000, enabled = true } = options;

  const query = useQuery({
    queryKey: ['optimized-vehicles'],
    queryFn: async (): Promise<VehicleData[]> => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }

      // Transform database records to VehicleData format
      return (data || []).map(item => ({
        id: item.id,
        device_id: item.gp51_device_id || item.id,
        device_name: item.name || `Vehicle ${item.id}`,
        name: item.name || `Vehicle ${item.id}`,
        gp51_device_id: item.gp51_device_id || item.id,
        user_id: item.user_id,
        sim_number: item.sim_number,
        created_at: item.created_at,
        updated_at: item.updated_at,
        is_active: item.is_active || false,
        isOnline: false,
        isMoving: false,
        lastUpdate: new Date(item.updated_at),
        alerts: [],
        status: 'offline' as const,
        last_position: null
      }));
    },
    refetchInterval: enabled ? refetchInterval : false,
    enabled
  });

  // Fix: Ensure refetch is a callable function
  const refetch = useCallback(async () => {
    if (query.refetch) {
      return await query.refetch();
    }
    return Promise.resolve();
  }, [query.refetch]);

  return {
    vehicles: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch
  };
}
