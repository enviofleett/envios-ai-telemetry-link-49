
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/owner';

export const useOwnerVehicles = (ownerId: string) => {
  return useQuery<VehicleData[], Error>({
    queryKey: ['owner-vehicles', ownerId],
    queryFn: async (): Promise<VehicleData[]> => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('device_id, device_name, status, created_at')
        .eq('owner_id', ownerId);

      if (error) {
        console.error('Failed to fetch owner vehicles:', error);
        throw error;
      }

      return (data || []) as VehicleData[];
    },
    enabled: !!ownerId,
  });
};
