
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SubscriberPackage } from "@/types/subscriber-packages";

/**
 * Retrieves the current user's active subscription package (if any).
 * Returns { package: SubscriberPackage | null, isLoading, error }
 */
export function useUserPackage(userId?: string) {
  return useQuery({
    queryKey: ["current-user-package", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      // Fetch the user's active subscription
      const { data: sub, error } = await supabase
        .from("user_subscriptions")
        .select("package_id")
        .eq("user_id", userId)
        .eq("subscription_status", "active")
        .single();

      if (error || !sub?.package_id) return null;
      // Fetch the package details
      const { data: pkg } = await supabase
        .from("subscriber_packages")
        .select("*")
        .eq("id", sub.package_id)
        .single();
      return pkg as SubscriberPackage;
    },
  });
}
