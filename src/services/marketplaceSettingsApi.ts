
import { supabase } from "@/integrations/supabase/client";
import { MarketplaceSettings } from "@/types/marketplace-settings";

// Fetch marketplace settings
export async function fetchMarketplaceSettings(): Promise<MarketplaceSettings | null> {
  const { data, error } = await supabase
    .from("marketplace_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Update marketplace settings
export async function updateMarketplaceSettings(values: MarketplaceSettings) {
  const { data, error } = await supabase
    .from("marketplace_settings")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", values.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Create marketplace settings row (for admins)
export async function createMarketplaceSettings(values: MarketplaceSettings) {
  const { data, error } = await supabase
    .from("marketplace_settings")
    .insert({
      commission_rate: values.commission_rate,
      registration_fee: values.registration_fee,
      connection_fee: values.connection_fee,
      currency: values.currency,
      updated_by: values.updated_by,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
