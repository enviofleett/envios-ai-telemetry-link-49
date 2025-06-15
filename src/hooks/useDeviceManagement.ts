
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

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

      return data || [];
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
