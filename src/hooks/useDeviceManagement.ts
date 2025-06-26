
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData, VehicleDbRecord, VehicleStatus } from '@/types/vehicle';

// Helper to determine vehicle status based on database fields
const getVehicleStatus = (): VehicleStatus => {
  // This logic is simplified as we don't have is_active or status from DB.
  // This should be determined by GP51 data, so 'offline' is a safe default.
  return 'offline';
};

const mapDbToDisplayVehicle = (dbVehicle: VehicleDbRecord): VehicleData => {
    return {
        id: dbVehicle.id,
        device_id: dbVehicle.gp51_device_id,
        gp51_device_id: dbVehicle.gp51_device_id,
        device_name: dbVehicle.name,
        name: dbVehicle.name,
        user_id: dbVehicle.user_id,
        sim_number: dbVehicle.sim_number,
        created_at: dbVehicle.created_at,
        updated_at: dbVehicle.updated_at,
        status: getVehicleStatus(),
        is_active: dbVehicle.is_active,
        alerts: [],
        isOnline: false,
        isMoving: false,
        lastUpdate: new Date(dbVehicle.updated_at),
        license_plate: undefined,
    };
};

export const useDeviceManagement = (searchQuery: string = '') => {
  const query = useQuery({
    queryKey: ['device-management', searchQuery],
    queryFn: async (): Promise<VehicleData[]> => {
      let queryBuilder = supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, created_at, updated_at, user_id, sim_number, is_active')
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
      
      if (!data) {
        return [];
      }

      const dbRecords = data.map(item => ({
        id: item.id,
        device_id: item.gp51_device_id,
        device_name: item.name,
        gp51_device_id: item.gp51_device_id,
        name: item.name,
        user_id: item.user_id,
        sim_number: item.sim_number,
        created_at: item.created_at,
        updated_at: item.updated_at,
        is_active: item.is_active || false
      })) as VehicleDbRecord[];

      const transformedData: VehicleData[] = dbRecords.map(mapDbToDisplayVehicle);

      return transformedData;
    },
    refetchInterval: 30000,
  });

  return {
    devices: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};
