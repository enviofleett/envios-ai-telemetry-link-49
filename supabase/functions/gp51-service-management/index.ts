
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

    console.log('GP51 Service Management API call:', action);

    // Handle test_connection as a special case - just validate we have a valid session
    if (action === 'test_connection') {
      console.log('Testing GP51 connection by validating session...');
      
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at')
        .order('created_at', { ascending: false })
        .order('token_expires_at', { ascending: false })
        .limit(1);

      if (sessionError || !sessions || sessions.length === 0) {
        console.error('No GP51 sessions found:', sessionError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No GP51 sessions configured' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const latestSession = sessions[0];
      
      // Check if session is expired
      const now = new Date();
      const expiresAt = new Date(latestSession.token_expires_at);
      
      if (expiresAt <= now) {
        console.error('GP51 session expired:', latestSession.username, 'expired at', expiresAt);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'GP51 session expired' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('GP51 connection test successful for user:', latestSession.username);
      return new Response(
        JSON.stringify({ 
          success: true, 
          username: latestSession.username,
          expiresAt: latestSession.token_expires_at
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the most recent valid GP51 session (not hardcoded to 'admin')
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .order('token_expires_at', { ascending: false })
      .limit(5); // Get top 5 to find a valid one

    if (sessionError || !sessions || sessions.length === 0) {
      console.error('No GP51 sessions found:', sessionError);
      return new Response(
        JSON.stringify({ error: 'No GP51 sessions found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the first non-expired session
    let validSession = null;
    const now = new Date();
    
    for (const session of sessions) {
      const expiresAt = new Date(session.token_expires_at);
      if (expiresAt > now) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      console.error('All GP51 sessions are expired');
      return new Response(
        JSON.stringify({ error: 'All GP51 sessions expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Using GP51 session for user:', validSession.username);
    const token = validSession.gp51_token;

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

    // Update the session's last used timestamp
    await supabase
      .from('gp51_sessions')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', validSession.id);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('GP51 Service Management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
