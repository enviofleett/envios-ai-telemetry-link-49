
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { action, ...payload } = await req.json();
    
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('GP51 Device Management API call:', action);

    // Get admin credentials for GP51 API calls
    const { data: adminSession, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('username', 'admin') // This should be configurable
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !adminSession) {
      return new Response(
        JSON.stringify({ error: 'Admin GP51 session not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if admin token is still valid
    if (new Date(adminSession.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Admin GP51 session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = adminSession.gp51_token;

    console.log('Calling GP51 API with action:', action);

    // Call GP51 API
    const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    const gp51Response = await fetch(`${GP51_API_BASE}/webapi?action=${action}&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    if (!gp51Response.ok) {
      console.error('GP51 API request failed:', gp51Response.status);
      return new Response(
        JSON.stringify({ error: 'GP51 API request failed', status: gp51Response.status }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await gp51Response.json();
    console.log('GP51 API response:', result);

    // Log the API call for audit purposes
    await supabase
      .from('gp51_sessions')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', adminSession.id);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('GP51 Device Management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
