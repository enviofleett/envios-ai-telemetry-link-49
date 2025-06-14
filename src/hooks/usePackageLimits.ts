
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Reads per-package vehicle/tracking feature limits from the DB.
 * Returns { limit: number | null, isLoading, error }
 */
export function usePackageLimits(packageId?: string) {
  return useQuery({
    queryKey: ['package-limits', packageId],
    enabled: !!packageId,
    queryFn: async () => {
      if (!packageId) return { vehicleLimit: null };
      // Imagine we store a JSONB 'limits' in subscriber_packages {vehicle_limit: number}
      const { data, error } = await supabase
        .from('subscriber_packages')
        .select('limits')
        .eq('id', packageId)
        .single();
      if (error) throw error;
      return data?.limits || { vehicleLimit: null };
    }
  });
}
