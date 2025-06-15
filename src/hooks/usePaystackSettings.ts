
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePaystackSettings = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["paystack-settings", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("paystack_settings")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: async (settings: any) => {
      const { data, error } = await supabase
        .from("paystack_settings")
        .upsert(settings, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paystack-settings", userId] });
    },
  });

  return {
    ...query,
    save: mutation.mutateAsync,
    saving: mutation.isPending,
  };
};
