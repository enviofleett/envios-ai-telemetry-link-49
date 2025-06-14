import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchMarketplaceSettings, 
  updateMarketplaceSettings, 
  createMarketplaceSettings 
} from "@/services/marketplaceSettingsApi";
import { MarketplaceSettings } from "@/types/marketplace-settings";

interface UseMarketplaceSettingsFormResult {
  form: MarketplaceSettings;
  setForm: React.Dispatch<React.SetStateAction<MarketplaceSettings>>;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSave: (e: React.FormEvent) => void;
  settings: MarketplaceSettings | null | undefined;
  isSaving: boolean;
}

export function useMarketplaceSettingsForm(): UseMarketplaceSettingsFormResult {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: settings, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["marketplace_settings"],
    queryFn: fetchMarketplaceSettings,
  });

  const [form, setForm] = React.useState<MarketplaceSettings>({
    commission_rate: settings?.commission_rate ?? 10,
    registration_fee: settings?.registration_fee ?? 100,
    connection_fee: settings?.connection_fee ?? 5,
    currency: settings?.currency ?? "USD",
    id: settings?.id ?? null,
  });

  // Keep form in sync with fetched data
  React.useEffect(() => {
    if (settings) {
      setForm({
        commission_rate: settings.commission_rate,
        registration_fee: settings.registration_fee,
        connection_fee: settings.connection_fee,
        currency: settings.currency,
        id: settings.id ?? null,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: updateMarketplaceSettings,
    onSuccess: () => {
      toast({
        title: "Settings updated!",
        description: "Marketplace settings were saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["marketplace_settings"] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "Could not update settings",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: createMarketplaceSettings,
    onSuccess: () => {
      toast({
        title: "Default settings created",
        description: "Marketplace settings were initialized.",
      });
      queryClient.invalidateQueries({ queryKey: ["marketplace_settings"] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "Could not create settings",
        variant: "destructive",
      });
    },
  });

  const isSaving = updateMutation.isPending || createMutation.isPending;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast({
        title: "Auth error",
        description: "Admin user not found.",
        variant: "destructive",
      });
      return;
    }
    if (form.id) {
      updateMutation.mutate({ ...form, updated_by: user.id });
    } else {
      createMutation.mutate({ ...form, updated_by: user.id });
    }
  };

  return {
    form,
    setForm,
    isLoading,
    isError,
    error,
    handleChange,
    handleSave,
    settings,
    isSaving,
  };
}
