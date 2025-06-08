
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OwnerVehicleData {
  device_id: string;
  device_name: string;
  status: string;
  created_at: string;
}

export const useOwnerVehicles = (ownerId: string): UseQueryResult<OwnerVehicleData[], Error> => {
  return useQuery<OwnerVehicleData[], Error>({
    queryKey: ['owner-vehicles', ownerId],
    queryFn: async function(): Promise<OwnerVehicleData[]> {
      const { data, error } = await supabase
        .from('vehicles')
        .select('device_id, device_name, status, created_at')
        .eq('owner_id', ownerId);

      if (error) {
        console.error('Failed to fetch owner vehicles:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      // Explicitly type the mapping to avoid inference issues
      const result: OwnerVehicleData[] = data.map((item: any) => {
        return {
          device_id: String(item.device_id || ''),
          device_name: String(item.device_name || ''),
          status: String(item.status || ''),
          created_at: String(item.created_at || '')
        };
      });

      return result;
    },
    enabled: !!ownerId,
  });
};
