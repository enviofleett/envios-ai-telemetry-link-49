
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCategoryCommissionRates, upsertCategoryCommissionRate } from "@/services/categoryCommissionRatesApi";
import { useToast } from "@/hooks/use-toast";
import type { CategoryCommissionRate } from "@/types/category-commission-rate";

export function useCategoryCommissionRates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["category_commission_rates"],
    queryFn: fetchCategoryCommissionRates,
  });

  const mutation = useMutation({
    mutationFn: upsertCategoryCommissionRate,
    onSuccess: () => {
      toast({
        title: "Category commission saved",
        description: "Commission rate for category updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["category_commission_rates"] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "Could not save category commission rate",
        variant: "destructive",
      });
    },
  });

  return {
    data,
    isLoading,
    isError,
    error,
    saveCategoryRate: mutation.mutate,
    isSaving: mutation.isPending,
  };
}
