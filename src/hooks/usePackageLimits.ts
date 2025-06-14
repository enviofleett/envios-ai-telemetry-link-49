
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
      // Fetch vehicle_limit directly from subscriber_packages
      const { data, error } = await supabase
        .from('subscriber_packages')
        .select('vehicle_limit')
        .eq('id', packageId)
        .single();
      if (error) throw error;
      return { vehicleLimit: data?.vehicle_limit ?? null };
    }
  });
}
