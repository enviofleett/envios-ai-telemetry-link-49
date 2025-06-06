
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
  return useQuery({
    queryKey: ['device-management', searchQuery],
    queryFn: async (): Promise<Device[]> => {
      let query = supabase
        .from('vehicles')
        .select('device_id, license_plate, gp51_metadata, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(
          `device_id.ilike.%${searchQuery}%,license_plate.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('Error fetching devices:', error);
        throw error;
      }

      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};
