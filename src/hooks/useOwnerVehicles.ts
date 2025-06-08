
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OwnerVehicleData {
  device_id: string;
  device_name: string;
  status: string;
  created_at: string;
}

// Define a simple interface for the raw database response
interface RawVehicleData {
  device_id: string;
  device_name: string;
  status: string;
  created_at: string;
}

export const useOwnerVehicles = (ownerId: string) => {
  return useQuery({
    queryKey: ['owner-vehicles', ownerId],
    queryFn: async (): Promise<OwnerVehicleData[]> => {
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

      // Explicitly cast the data to our expected type to avoid type inference issues
      const rawData = data as RawVehicleData[];
      
      return rawData.map((item): OwnerVehicleData => ({
        device_id: item.device_id,
        device_name: item.device_name,
        status: item.status,
        created_at: item.created_at
      }));
    },
    enabled: !!ownerId,
  });
};
