import { supabase } from "@/integrations/supabase/client";
import { CountryMarketplaceSettings } from "@/types/country-marketplace-settings";

export async function fetchCountryMarketplaceSettings(): Promise<CountryMarketplaceSettings[]> {
  const { data, error } = await supabase
    .from("country_marketplace_settings")
    .select("*")
    .order("country_code", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function upsertCountryMarketplaceSettings(payload: Partial<CountryMarketplaceSettings> & { country_code: string }) {
  const { data, error } = await supabase
    .from("country_marketplace_settings")
    .upsert(payload, { onConflict: "country_code" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCountryMarketplaceSettings(id: string) {
  const { error } = await supabase
    .from("country_marketplace_settings")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}
