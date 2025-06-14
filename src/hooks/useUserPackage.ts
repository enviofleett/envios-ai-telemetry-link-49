
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SubscriberPackage } from "@/types/subscriber-packages";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Retrieves the current user's active subscription package (if any).
 * Returns { package: SubscriberPackage | null, isLoading, error }
 */
export function useUserPackage(userId?: string) {
  const { isAdmin } = useAuth();
  // Fast path: Admins always have an unlimited "admin" package,
  // skip querying DB for them
  if (isAdmin) {
    return {
      data: {
        id: "admin-unlimited",
        package_name: "Admin Unlimited",
        description: "Admin account: All features enabled, unlimited limits.",
        user_type: "both",
        subscription_fee_monthly: 0,
        subscription_fee_annually: 0,
        referral_discount_percentage: 0,
        is_active: true,
        created_at: "",
        updated_at: "",
        vehicle_limit: null,
      } as SubscriberPackage,
      isLoading: false,
      error: null,
    };
  }

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
