
import { supabase } from "@/integrations/supabase/client";
import { CategoryCommissionRate } from "@/types/category-commission-rate";

export async function fetchCategoryCommissionRates(): Promise<CategoryCommissionRate[]> {
  const { data, error } = await supabase
    .from("category_commission_rates")
    .select("*")
    .order("category_id", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function upsertCategoryCommissionRate(payload: Partial<CategoryCommissionRate> & { category_id: string; country_code: string }) {
  const { data, error } = await supabase
    .from("category_commission_rates")
    .upsert(payload, { onConflict: "category_id,country_code" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
