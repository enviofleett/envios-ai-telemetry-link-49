
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns { hasFeature(featureId: string): boolean, features: string[], isLoading, error }
 */
export function useFeatureAccess(packageId?: string) {
  const { isAdmin } = useAuth();

  // Fast path: Admins always have all features
  if (isAdmin) {
    return {
      hasFeature: (_featureId: string) => true,
      features: [],
      isLoading: false,
      error: null,
    };
  }

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
