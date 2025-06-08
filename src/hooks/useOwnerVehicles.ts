

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VehicleQueryResult {
  device_id: string;
  device_name: string;
  status: string;
  created_at: string;
}

export const useOwnerVehicles = (ownerId: string): UseQueryResult<VehicleQueryResult[], Error> => {
  return useQuery({
    queryKey: ['owner-vehicles', ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('device_id, device_name, status, created_at')
        .eq('owner_id', ownerId);

      if (error) {
        console.error('Failed to fetch owner vehicles:', error);
        throw error;
      }

      return data as VehicleQueryResult[];
    },
    enabled: !!ownerId,
  });
};

