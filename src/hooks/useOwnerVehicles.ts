
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LightweightVehicle } from '@/types/database-operations';

export interface OwnerVehicleData {
  device_id: string;
  device_name: string;
  status: string;
  created_at: string;
}

// Use a simple approach to avoid type inference issues
const fetchOwnerVehicles = async (ownerId: string): Promise<OwnerVehicleData[]> => {
  try {
    // Use correct column names that exist in the vehicles table
    const { data, error } = await supabase
      .from('vehicles')
      .select('gp51_device_id, name, created_at, updated_at')
      .eq('user_id', ownerId);

    if (error) {
      console.error('Failed to fetch owner vehicles:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Transform to our expected format with correct column mapping
    return data.map((item: any) => ({
      device_id: String(item.gp51_device_id || ''),
      device_name: String(item.name || ''),
      status: 'offline', // Default status since vehicles table doesn't have status column
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
