
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Reads per-package vehicle/tracking feature limits from the DB.
 * Returns { vehicleLimit: number | null, isLoading, error }
 */
export function usePackageLimits(packageId?: string) {
  return useQuery({
    queryKey: ['package-limits', packageId],
    enabled: !!packageId,
    queryFn: async () => {
      if (!packageId) return { vehicleLimit: null };
      // Safely fetch vehicle limit, fallback to null if not present
      const { data, error } = await supabase
        .from('subscriber_packages')
        .select('vehicle_limit')
        .eq('id', packageId)
        .maybeSingle();
      if (error) throw error;
      // Only return if property actually exists (avoid runtime TS error)
      return { vehicleLimit: data && "vehicle_limit" in data ? (data.vehicle_limit ?? null) : null };
    }
  });
}
