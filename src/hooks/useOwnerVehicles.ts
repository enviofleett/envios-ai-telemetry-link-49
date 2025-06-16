
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleReference } from '@/types/owner';

// Use the lightweight VehicleReference type to avoid circular dependencies
const fetchOwnerVehicles = async (ownerId: string): Promise<VehicleReference[]> => {
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
  return useQuery<VehicleReference[], Error>({
    queryKey: ['owner-vehicles', ownerId],
    queryFn: () => fetchOwnerVehicles(ownerId),
    enabled: !!ownerId,
  });
};

// Export the type for backwards compatibility
export type { VehicleReference as OwnerVehicleData };
