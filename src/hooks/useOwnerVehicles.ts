
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OwnerVehicleData {
  device_id: string;
  device_name: string;
  status: string;
  created_at: string;
}

// Use a simple approach to avoid type inference issues
const fetchOwnerVehicles = async (ownerId: string): Promise<OwnerVehicleData[]> => {
  try {
    // Use any to avoid type inference problems with Supabase
    const response = await (supabase as any)
      .from('vehicles')
      .select('device_id, device_name, status, created_at')
      .eq('owner_id', ownerId);

    const { data, error } = response;

    if (error) {
      console.error('Failed to fetch owner vehicles:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Transform to our expected format
    return data.map((item: any) => ({
      device_id: String(item.device_id || ''),
      device_name: String(item.device_name || ''),
      status: String(item.status || ''),
      created_at: String(item.created_at || '')
    }));
  } catch (error) {
    console.error('Error in fetchOwnerVehicles:', error);
    throw error;
  }
};

export const useOwnerVehicles = (ownerId: string) => {
  return useQuery<OwnerVehicleData[], Error>({
    queryKey: ['owner-vehicles', ownerId],
    queryFn: () => fetchOwnerVehicles(ownerId),
    enabled: !!ownerId,
  });
};
