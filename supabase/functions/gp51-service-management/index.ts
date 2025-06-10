
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log(`GP51 Service Management API call: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action } = await req.json();
    console.log(`GP51 Service Management API call: ${action}`);

    if (action === 'test_connection') {
      console.log('Testing GP51 connection by validating session...');
      
      // Check if we have any valid GP51 sessions
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at, api_url')
        .order('token_expires_at', { ascending: false })
        .limit(1);

      if (sessionError) {
        console.error('Database error during session check:', sessionError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Database connection failed',
            details: sessionError.message,
            code: 'DB_ERROR'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!sessions || sessions.length === 0) {
        console.error('No GP51 sessions found:', sessions);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No GP51 sessions configured',
            details: 'Please configure GP51 credentials in Admin Settings',
            code: 'NO_SESSIONS'
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const session = sessions[0];
      const expiresAt = new Date(session.token_expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        console.error('GP51 session expired:', { expiresAt, now });
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'GP51 session expired',
            details: 'Please refresh your GP51 credentials',
            code: 'SESSION_EXPIRED',
            expiresAt: session.token_expires_at
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Session is valid
      console.log('✅ GP51 session validation successful');
      return new Response(
        JSON.stringify({ 
          success: true, 
          username: session.username,
          apiUrl: session.api_url,
          expiresAt: session.token_expires_at,
          message: 'GP51 connection is healthy'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle other actions here
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Unknown action',
        code: 'UNKNOWN_ACTION'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('GP51 Service Management error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
