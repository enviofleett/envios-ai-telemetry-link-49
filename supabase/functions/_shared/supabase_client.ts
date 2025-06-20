
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in Supabase Edge Function secrets.");
    }

    supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabase;
}
