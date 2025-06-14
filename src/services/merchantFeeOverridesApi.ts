import { supabase } from "@/integrations/supabase/client";
import { MerchantFeeOverride } from "@/types/merchant-fee-override";

export async function fetchMerchantFeeOverrides(): Promise<MerchantFeeOverride[]> {
  const { data, error } = await supabase
    .from("merchant_fee_overrides")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertMerchantFeeOverride(payload: Partial<MerchantFeeOverride> & { merchant_id: string }) {
  const { data, error } = await supabase
    .from("merchant_fee_overrides")
    .upsert(payload, { onConflict: "merchant_id,country_code" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMerchantFeeOverride(id: string) {
  const { error } = await supabase
    .from("merchant_fee_overrides")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}
