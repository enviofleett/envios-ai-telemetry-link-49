
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GP51_API_URL = "https://api.gpstrackerxy.com/api";

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

    if (action === 'test_gp51_api') {
      console.log('Testing real GP51 API connectivity...');
      
      // Get session first
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at, api_url')
        .order('token_expires_at', { ascending: false })
        .limit(1);

      if (sessionError || !sessions || sessions.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No valid GP51 session found',
            details: 'Please configure GP51 credentials first',
            code: 'NO_SESSION'
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
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'GP51 session expired',
            details: 'Please refresh your GP51 credentials',
            code: 'SESSION_EXPIRED'
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Test actual GP51 API using proper format
      const suser = session.username;
      const stoken = session.gp51_token;

      try {
        console.log('📡 Making real GP51 API call to test connectivity...');
        
        const formData = new URLSearchParams({
          action: 'querymonitorlist',
          json: '1',
          suser,
          stoken
        });

        const testResponse = await fetch(GP51_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'EnvioFleet/1.0'
          },
          body: formData.toString()
        });

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error('❌ GP51 API HTTP error:', testResponse.status, errorText);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'GP51 API HTTP error',
              details: `HTTP ${testResponse.status}: ${errorText}`,
              code: 'API_HTTP_ERROR'
            }),
            { 
              status: 502, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const responseText = await testResponse.text();
        console.log('📊 Raw GP51 API response:', responseText.substring(0, 200) + '...');
        
        const responseData = JSON.parse(responseText);

        if (responseData.result === "false" || responseData.result === false) {
          console.error('❌ GP51 API returned error:', responseData);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'GP51 API error',
              details: responseData.message || 'Unknown GP51 error',
              code: 'API_LOGIC_ERROR'
            }),
            { 
              status: 502, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        console.log('✅ GP51 API test successful');
        return new Response(
          JSON.stringify({ 
            success: true, 
            username: session.username,
            apiUrl: GP51_API_URL,
            message: 'GP51 API is responding correctly',
            deviceCount: responseData.devices ? responseData.devices.length : 0
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );

      } catch (apiError) {
        console.error('❌ GP51 API connection failed:', apiError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'GP51 API connection failed',
            details: apiError instanceof Error ? apiError.message : 'Network error',
            code: 'API_CONNECTION_ERROR'
          }),
          { 
            status: 502, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Handle other actions here
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Unknown action',
        details: `Action '${action}' is not supported`,
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
