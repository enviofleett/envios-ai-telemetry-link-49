
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Device {
  device_id: string;
  license_plate?: string;
  gp51_metadata?: any;
  created_at: string;
  updated_at: string;
}

export const useDeviceManagement = (searchQuery: string = '') => {
  const query = useQuery({
    queryKey: ['device-management', searchQuery],
    queryFn: async (): Promise<Device[]> => {
      let queryBuilder = supabase
        .from('vehicles')
        .select('device_id, gp51_metadata, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        queryBuilder = queryBuilder.or(
          `device_id.ilike.%${searchQuery}%`
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
