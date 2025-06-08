
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OwnerVehicleData {
  device_id: string;
  device_name: string;
  status: string;
  created_at: string;
}

// Separate function to handle the query logic with explicit typing
const fetchOwnerVehicles = async (ownerId: string): Promise<OwnerVehicleData[]> => {
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

  // Explicitly cast and map to avoid type inference issues
  const rawData = data as Array<{
    device_id: unknown;
    device_name: unknown;
    status: unknown;
    created_at: unknown;
  }>;

  return rawData.map(item => ({
    device_id: String(item.device_id || ''),
    device_name: String(item.device_name || ''),
    status: String(item.status || ''),
    created_at: String(item.created_at || '')
  }));
};

export const useOwnerVehicles = (ownerId: string) => {
  return useQuery({
    queryKey: ['owner-vehicles', ownerId],
    queryFn: () => fetchOwnerVehicles(ownerId),
    enabled: !!ownerId,
  });
};
