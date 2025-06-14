
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMerchantFeeOverrides, upsertMerchantFeeOverride } from "@/services/merchantFeeOverridesApi";
import { useToast } from "@/hooks/use-toast";
import type { MerchantFeeOverride } from "@/types/merchant-fee-override";

export function useMerchantFeeOverrides() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["merchant_fee_overrides"],
    queryFn: fetchMerchantFeeOverrides,
  });

  const mutation = useMutation({
    mutationFn: upsertMerchantFeeOverride,
    onSuccess: () => {
      toast({
        title: "Merchant fee saved",
        description: "Custom fees for merchant updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["merchant_fee_overrides"] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "Could not save merchant fee override",
        variant: "destructive",
      });
    },
  });

  return {
    data,
    isLoading,
    isError,
    error,
    saveMerchantFee: mutation.mutate,
    isSaving: mutation.isPending,
  };
}
