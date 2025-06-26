
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

export const useVehicleData = () => {
  return useQuery({
    queryKey: ['vehicles'],
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

      if (!vehicles) {
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
        status: 'offline',
        lastUpdate: new Date(vehicle.updated_at),
        is_active: false,
        last_position: undefined,
        alerts: [],
        isOnline: false,
        isMoving: false
      }));
    },
    refetchInterval: 30000
  });
};
