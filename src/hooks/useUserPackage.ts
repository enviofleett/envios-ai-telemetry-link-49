
import { useQuery } from "@tanstack/react-query";
import { subscriberPackageApi } from "@/services/subscriberPackageApi";
import type { SubscriberPackage } from "@/types/subscriber-packages";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

/**
 * Retrieves the current user's active subscription package (if any).
 * Returns { data: SubscriberPackage | null, isLoading, error }
 */
export function useUserPackage(userId?: string) {
  const { user } = useUnifiedAuth();
  
  return useQuery({
    queryKey: ["current-user-package", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      return subscriberPackageApi.getUserPackage(userId);
    },
  });
}
