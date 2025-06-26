
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

export const useStableVehicleData = () => {
  return useQuery({
    queryKey: ['stable-vehicles'],
    queryFn: async (): Promise<VehicleData[]> => {
      const { data: vehicles, error } = await supabase
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

      if (!vehicles || vehicles.length === 0) {
        return [];
      }

      return vehicles.map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        gp51_device_id: vehicle.gp51_device_id, // Added missing property
        device_name: vehicle.name,
        name: vehicle.name,
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        last_position: {
          latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
          speed: Math.floor(Math.random() * 80),
          course: Math.floor(Math.random() * 360),
          timestamp: new Date().toISOString()
        },
        status: Math.random() > 0.5 ? 'online' : 'offline',
        is_active: true,
        isOnline: Math.random() > 0.3,
        isMoving: Math.random() > 0.6,
        alerts: [],
        lastUpdate: new Date(),
        vehicleName: vehicle.name
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 2, // 2 minutes
  });
};
