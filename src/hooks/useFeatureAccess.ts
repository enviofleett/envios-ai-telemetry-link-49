
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

/**
 * Returns { hasFeature(featureId: string): boolean, features: string[], isLoading, error }
 */
export function useFeatureAccess(packageId?: string) {
  const { user } = useUnifiedAuth();

  // For now, no admin fast path since UnifiedAuth doesn't have role checking yet
  // TODO: Add admin bypass when UnifiedAuth supports role checking

  const { data: features, isLoading, error } = useQuery({
    queryKey: ["package-features", packageId],
    enabled: !!packageId,
    queryFn: async () => {
      if (!packageId) return [];
      // Get the features assigned to the package
      const { data, error } = await supabase
        .from("package_feature_assignments")
        .select("feature_id")
        .eq("package_id", packageId);
      if (error) throw error;
      // Return an array of feature IDs
      return (data || []).map((x) => x.feature_id);
    },
  });

  const hasFeature = (featureId: string) => {
    return !!features?.includes(featureId);
  };

  return { hasFeature, features: features || [], isLoading, error };
}
