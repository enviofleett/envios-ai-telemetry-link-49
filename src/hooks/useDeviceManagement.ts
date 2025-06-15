
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

// Helper to determine vehicle status based on database fields
const getVehicleStatus = (isActive: boolean, dbStatus: string | null | undefined): VehicleData['status'] => {
  if (!isActive) {
    return 'inactive';
  }
  switch (dbStatus) {
    case 'online':
    case 'moving':
    case 'idle':
      return dbStatus;
    case 'offline':
      return 'offline';
    default:
      // If active but status is unknown or null, consider it online.
      return 'online';
  }
};

export const useDeviceManagement = (searchQuery: string = '') => {
  const query = useQuery({
    queryKey: ['device-management', searchQuery],
    queryFn: async (): Promise<VehicleData[]> => {
      let queryBuilder = supabase
        .from('vehicles')
        .select('id, device_id, device_name, license_plate, is_active, gp51_metadata, created_at, updated_at, status')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        queryBuilder = queryBuilder.or(
          `device_id.ilike.%${searchQuery}%,device_name.ilike.%${searchQuery}%,license_plate.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await queryBuilder.limit(50);

      if (error) {
        console.error('Error fetching devices:', error);
        throw error;
      }

      // Transform the raw data to match the VehicleData interface
      const transformedData: VehicleData[] = (data || []).map((vehicle) => ({
        ...vehicle,
        gp51_metadata: vehicle.gp51_metadata as VehicleData['gp51_metadata'], // Cast to correct type
        status: getVehicleStatus(vehicle.is_active, vehicle.status),
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
