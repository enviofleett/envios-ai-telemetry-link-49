
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PackageLimits {
  vehicleLimit: number | null;
  chatbotPromptLimit: number;
}

/**
 * Gets package limits for the given package ID
 */
export function usePackageLimits(packageId?: string) {
  return useQuery({
    queryKey: ["package-limits", packageId],
    enabled: !!packageId,
    queryFn: async (): Promise<PackageLimits | null> => {
      if (!packageId) return null;
      
      const { data, error } = await supabase
        .from("subscriber_packages")
        .select("vehicle_limit, chatbot_prompt_limit")
        .eq("id", packageId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return {
        vehicleLimit: data.vehicle_limit,
        chatbotPromptLimit: data.chatbot_prompt_limit || 100,
      };
    },
  });
}
