
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase URL or Service Role Key is not set in environment variables.");
    }
    supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  }
  return supabase;
}
