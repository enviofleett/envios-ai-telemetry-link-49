
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCountryMarketplaceSettings, upsertCountryMarketplaceSettings } from "@/services/countryMarketplaceSettingsApi";
import { useToast } from "@/hooks/use-toast";
import type { CountryMarketplaceSettings } from "@/types/country-marketplace-settings";

export function useCountryMarketplaceSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["country_marketplace_settings"],
    queryFn: fetchCountryMarketplaceSettings,
  });

  const mutation = useMutation({
    mutationFn: upsertCountryMarketplaceSettings,
    onSuccess: () => {
      toast({
        title: "Country settings saved",
        description: "Country-specific marketplace settings updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["country_marketplace_settings"] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "Could not save country marketplace settings",
        variant: "destructive",
      });
    },
  });

  return {
    data,
    isLoading,
    isError,
    error,
    saveCountrySettings: mutation.mutate,
    isSaving: mutation.isPending,
  };
}
