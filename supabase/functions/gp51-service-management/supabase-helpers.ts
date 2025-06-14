
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { errorResponse } from "./response-helpers.ts";

export function initSupabaseClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

export async function getLatestGp51Session(supabase: SupabaseClient) {
  const { data: session, error: sessionError } = await supabase
    .from('gp51_sessions')
    .select('username, password_hash, token_expires_at, api_url')
    .order('token_expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError) {
    console.error('Database error during session check:', sessionError);
    // This specific error needs to be handled by the caller to include latency if needed
    // Or, pass startTime to this function if latency calculation is always needed here.
    // For now, returning null and the error for the caller to decide.
    return { session: null, error: sessionError, response: errorResponse('Database connection failed', 200) };
  }

  return { session, error: null, response: null };
}
