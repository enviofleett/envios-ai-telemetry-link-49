
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

interface UseStableVehicleDataOptions {
  search?: string;
}

export const useStableVehicleData = (options: UseStableVehicleDataOptions = {}) => {
  const query = useQuery({
    queryKey: ['stable-vehicles', options.search],
    queryFn: async (): Promise<VehicleData[]> => {
      let queryBuilder = supabase
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

      if (options.search) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${options.search}%,gp51_device_id.ilike.%${options.search}%`
        );
      }

      const { data: vehicles, error } = await queryBuilder;

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
        gp51_device_id: vehicle.gp51_device_id,
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
        latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
        is_active: true,
        status: Math.random() > 0.3 ? 'online' : 'offline',
        isOnline: Math.random() > 0.3,
        isMoving: Math.random() > 0.6,
        alerts: [],
        lastUpdate: new Date(),
        vehicleName: vehicle.name,
        speed: Math.floor(Math.random() * 80),
        course: Math.floor(Math.random() * 360)
      }));
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 2,
  });

  return {
    vehicles: query.data || [],
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    allVehicles: query.data || [],
    syncStatus: { isConnected: true, lastSync: new Date(), isSync: false },
    isConnected: true,
    forceSync: async () => { await query.refetch(); },
    events: [] as any[],
    acknowledgeEvent: async (eventId: string) => { console.log('Acknowledge event:', eventId); }
  };
};
