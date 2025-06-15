import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

// Helper to determine vehicle status based on database fields
const getVehicleStatus = (): VehicleData['status'] => {
  // This logic is now simplified as we don't have is_active or status from DB.
  // This should be determined by GP51 data, so 'offline' is a safe default.
  return 'offline';
};

export const useDeviceManagement = (searchQuery: string = '') => {
  const query = useQuery({
    queryKey: ['device-management', searchQuery],
    queryFn: async (): Promise<VehicleData[]> => {
      let queryBuilder = supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, created_at, updated_at, user_id, sim_number')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        queryBuilder = queryBuilder.or(
          `gp51_device_id.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await queryBuilder.limit(50);

      if (error) {
        console.error('Error fetching devices:', error);
        throw error;
      }

      // Transform the raw data to match the VehicleData interface
      const transformedData: VehicleData[] = (data || []).map((dbVehicle) => ({
        id: dbVehicle.id,
        device_id: dbVehicle.gp51_device_id,
        device_name: dbVehicle.name,
        user_id: dbVehicle.user_id,
        sim_number: dbVehicle.sim_number,
        created_at: dbVehicle.created_at,
        updated_at: dbVehicle.updated_at,
        license_plate: undefined, // Not in DB
        status: getVehicleStatus(),
        is_active: false, // Default value, since it's not in DB
        gp51_metadata: {}, // Default value
        alerts: [],
        isOnline: false,
        isMoving: false,
        lastUpdate: new Date(dbVehicle.updated_at),
        vehicleName: dbVehicle.name,
      }));

      return transformedData;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  return {
    devices: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};
