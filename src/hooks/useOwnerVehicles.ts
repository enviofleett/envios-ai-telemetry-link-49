
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OwnerVehicle {
  device_id: string;
  device_name: string;
  status: string;
  created_at: string;
}

export const useOwnerVehicles = (ownerId: string) => {
  return useQuery({
    queryKey: ['owner-vehicles', ownerId],
    queryFn: async (): Promise<OwnerVehicle[]> => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('device_id, device_name, status, created_at')
        .eq('owner_id', ownerId);

      if (error) {
        console.error('Failed to fetch owner vehicles:', error);
        throw error;
      }

      return (data || []) as OwnerVehicle[];
    },
    enabled: !!ownerId,
  });
};
