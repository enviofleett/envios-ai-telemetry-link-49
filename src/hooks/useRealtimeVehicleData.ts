
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

export const useRealtimeVehicleData = (refreshInterval: number = 30000) => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['realtime-vehicles'],
    queryFn: async (): Promise<VehicleData[]> => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          sim_number,
          user_id,
          created_at,
          updated_at,
          envio_users (
            name,
            email
          )
        `);

      if (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }

      return (data || []).map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        gp51_device_id: vehicle.gp51_device_id, // Added missing property
        device_name: vehicle.name,
        name: vehicle.name,
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        vin: undefined,
        license_plate: undefined,
        is_active: true,
        last_position: undefined,
        status: 'online',
        isOnline: Math.random() > 0.3,
        isMoving: Math.random() > 0.6,
        alerts: [],
        lastUpdate: new Date()
      }));
    },
    refetchInterval: refreshInterval
  });

  const forceRefresh = useCallback(async () => {
    setLastUpdate(new Date());
    await refetch();
  }, [refetch]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vehicles' },
        () => {
          setLastUpdate(new Date());
          queryClient.invalidateQueries({ queryKey: ['realtime-vehicles'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Mock enhanced vehicles with real-time data simulation
  const enhancedVehicles = vehicles.map(vehicle => ({
    ...vehicle,
    gp51_device_id: vehicle.gp51_device_id || vehicle.device_id, // Ensure property exists
    last_position: vehicle.last_position || {
      latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
      speed: Math.floor(Math.random() * 80),
      course: Math.floor(Math.random() * 360),
      timestamp: new Date().toISOString()
    },
    isOnline: Math.random() > 0.3,
    isMoving: Math.random() > 0.6,
    lastUpdate: new Date()
  }));

  return {
    vehicles: enhancedVehicles,
    isLoading,
    error,
    lastUpdate,
    refetch: forceRefresh
  };
};
