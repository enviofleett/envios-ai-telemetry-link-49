
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { CORS_HEADERS } from '../_shared/cors.ts';

serve(async (_req) => {
  console.log(`[package-service] Received request: ${_req.method} ${_req.url}`);
  if (_req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Use the anon key here as this endpoint is public for registration
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('[package-service] Fetching active packages...');
    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('[package-service] Error fetching packages:', error);
      throw error;
    }

    console.log(`[package-service] Found ${packages.length} active packages.`);
    return new Response(JSON.stringify({ success: true, packages }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(`[package-service] Top-level error: ${error.message}`);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
