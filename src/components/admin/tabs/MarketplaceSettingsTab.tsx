
import React, { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Utility for fetching marketplace settings
async function fetchMarketplaceSettings() {
  const { data, error } = await window.supabase
    .from("marketplace_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

// Utility for updating marketplace settings
async function updateMarketplaceSettings(values: any) {
  const { data, error } = await window.supabase
    .from("marketplace_settings")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", values.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Utility for creating initial row if not exists (admins only)
async function createMarketplaceSettings(values: any) {
  const { data, error } = await window.supabase
    .from("marketplace_settings")
    .insert({
      commission_rate: values.commission_rate,
      registration_fee: values.registration_fee,
      connection_fee: values.connection_fee,
      currency: values.currency,
      updated_by: values.updated_by
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export const MarketplaceSettingsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin user for setting updated_by (assumes Auth context exposes user)
  const user = window.supabase.auth.user?.() ?? {};

  const {
    data: settings,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["marketplace_settings"],
    queryFn: fetchMarketplaceSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateMarketplaceSettings,
    onSuccess: () => {
      toast({ title: "Settings updated!", description: "Marketplace settings were saved." });
      queryClient.invalidateQueries({ queryKey: ["marketplace_settings"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Could not update settings", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: createMarketplaceSettings,
    onSuccess: () => {
      toast({ title: "Default settings created", description: "Marketplace settings were initialized." });
      queryClient.invalidateQueries({ queryKey: ["marketplace_settings"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Could not create settings", variant: "destructive" });
    },
  });

  // Local state for editing fields
  const [form, setForm] = React.useState({
    commission_rate: settings?.commission_rate ?? 10,
    registration_fee: settings?.registration_fee ?? 100,
    connection_fee: settings?.connection_fee ?? 5,
    currency: settings?.currency ?? "USD",
    id: settings?.id ?? null
  });

  React.useEffect(() => {
    if (settings) {
      setForm({
        commission_rate: settings.commission_rate,
        registration_fee: settings.registration_fee,
        connection_fee: settings.connection_fee,
        currency: settings.currency,
        id: settings.id
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (form.id) {
        updateMutation.mutate({ ...form, updated_by: user.id });
      } else {
        createMutation.mutate({ ...form, updated_by: user.id });
      }
    },
    // eslint-disable-next-line
    [form, user.id]
  );

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  if (isError)
    return (
      <div className="text-red-600 py-4">
        Error loading settings: {(error as any)?.message || "Unknown error"}
        <Button onClick={() => refetch()} className="ml-3" size="sm" variant="outline">Retry</Button>
      </div>
    );

  return (
    <Card className="max-w-xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Marketplace Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="font-medium" htmlFor="commission_rate">
              Default Commission Rate (%)
            </label>
            <Input
              id="commission_rate"
              name="commission_rate"
              type="number"
              step="0.01"
              value={form.commission_rate}
              onChange={handleChange}
              min={0}
              max={100}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="font-medium" htmlFor="registration_fee">
              Registration Fee
            </label>
            <Input
              id="registration_fee"
              name="registration_fee"
              type="number"
              step="0.01"
              value={form.registration_fee}
              onChange={handleChange}
              min={0}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="font-medium" htmlFor="connection_fee">
              Connection Fee (per vehicle)
            </label>
            <Input
              id="connection_fee"
              name="connection_fee"
              type="number"
              step="0.01"
              value={form.connection_fee}
              onChange={handleChange}
              min={0}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="font-medium" htmlFor="currency">
              Currency
            </label>
            <Input
              id="currency"
              name="currency"
              type="text"
              maxLength={6}
              value={form.currency}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>
          <div className="pt-6 flex">
            <Button type="submit" className="ml-auto">
              {form.id ? "Update Settings" : "Create Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MarketplaceSettingsTab;

