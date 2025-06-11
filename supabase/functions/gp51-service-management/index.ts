
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GP51_API_URL = "https://www.gps51.com/webapi";

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
      const startTime = Date.now();
      
      // Check if we have any valid GP51 sessions
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_password, token_expires_at, api_url')
        .order('token_expires_at', { ascending: false })
        .limit(1);

      if (sessionError) {
        console.error('Database error during session check:', sessionError);
        return new Response(
          JSON.stringify({ 
            status: 'critical',
            isValid: false,
            expiresAt: null,
            username: null,
            lastCheck: new Date(),
            consecutiveFailures: 1,
            isAuthError: false,
            latency: Date.now() - startTime,
            needsRefresh: false,
            errorMessage: 'Database connection failed'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!sessions || sessions.length === 0) {
        console.error('No GP51 sessions found:', sessions);
        return new Response(
          JSON.stringify({ 
            status: 'critical',
            isValid: false,
            expiresAt: null,
            username: null,
            lastCheck: new Date(),
            consecutiveFailures: 1,
            isAuthError: true,
            latency: Date.now() - startTime,
            needsRefresh: false,
            errorMessage: 'No GP51 sessions configured'
          }),
          { 
            status: 200, 
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
            status: 'critical',
            isValid: false,
            expiresAt: expiresAt,
            username: session.username,
            lastCheck: new Date(),
            consecutiveFailures: 1,
            isAuthError: true,
            latency: Date.now() - startTime,
            needsRefresh: true,
            errorMessage: 'GP51 session expired'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check if session needs refresh (within 10 minutes of expiration)
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const needsRefresh = timeUntilExpiry < 10 * 60 * 1000; // 10 minutes

      // Session is valid
      console.log('✅ GP51 session validation successful');
      return new Response(
        JSON.stringify({ 
          status: needsRefresh ? 'degraded' : 'healthy',
          isValid: true,
          expiresAt: expiresAt,
          username: session.username,
          lastCheck: new Date(),
          consecutiveFailures: 0,
          isAuthError: false,
          latency: Date.now() - startTime,
          needsRefresh: needsRefresh,
          errorMessage: null
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (action === 'test_gp51_api') {
      console.log('Testing real GP51 API connectivity...');
      const startTime = Date.now();
      
      // Get session first
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_password, token_expires_at, api_url')
        .order('token_expires_at', { ascending: false })
        .limit(1);

      if (sessionError || !sessions || sessions.length === 0) {
        return new Response(
          JSON.stringify({ 
            status: 'critical',
            isValid: false,
            expiresAt: null,
            username: null,
            lastCheck: new Date(),
            consecutiveFailures: 1,
            isAuthError: true,
            latency: Date.now() - startTime,
            needsRefresh: false,
            errorMessage: 'No valid GP51 session found'
          }),
          { 
            status: 200, 
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
            status: 'critical',
            isValid: false,
            expiresAt: expiresAt,
            username: session.username,
            lastCheck: new Date(),
            consecutiveFailures: 1,
            isAuthError: true,
            latency: Date.now() - startTime,
            needsRefresh: true,
            errorMessage: 'GP51 session expired'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Hash password for authentication
      const encoder = new TextEncoder();
      const data = encoder.encode(session.gp51_password);
      const hashBuffer = await crypto.subtle.digest('MD5', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      try {
        console.log('📡 Making real GP51 API call to test connectivity...');
        
        const formData = new URLSearchParams({
          action: 'querymonitorlist',
          username: session.username,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER'
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

        const latency = Date.now() - startTime;
        console.log("GP51 API call result:", testResponse.status);

        if (!testResponse.ok) {
          console.error('❌ GP51 API HTTP error:', testResponse.status);
          return new Response(
            JSON.stringify({ 
              status: 'critical',
              isValid: false,
              expiresAt: expiresAt,
              username: session.username,
              lastCheck: new Date(),
              consecutiveFailures: 1,
              isAuthError: testResponse.status === 401 || testResponse.status === 403,
              latency: latency,
              needsRefresh: false,
              errorMessage: `GP51 API HTTP error: ${testResponse.status}`
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const responseText = await testResponse.text();
        console.log('📊 Raw GP51 API response:', responseText.substring(0, 200) + '...');
        
        const responseData = JSON.parse(responseText);

        if (responseData.status !== 0) {
          console.error('❌ GP51 API returned error:', responseData);
          return new Response(
            JSON.stringify({ 
              status: 'critical',
              isValid: false,
              expiresAt: expiresAt,
              username: session.username,
              lastCheck: new Date(),
              consecutiveFailures: 1,
              isAuthError: true,
              latency: latency,
              needsRefresh: false,
              errorMessage: responseData.message || 'GP51 API logic error'
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Check if session needs refresh
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const needsRefresh = timeUntilExpiry < 10 * 60 * 1000; // 10 minutes

        console.log('✅ GP51 API test successful');
        return new Response(
          JSON.stringify({ 
            status: needsRefresh ? 'degraded' : 'healthy',
            isValid: true,
            expiresAt: expiresAt,
            username: session.username,
            lastCheck: new Date(),
            consecutiveFailures: 0,
            isAuthError: false,
            latency: latency,
            needsRefresh: needsRefresh,
            errorMessage: null,
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
            status: 'critical',
            isValid: false,
            expiresAt: expiresAt,
            username: session.username,
            lastCheck: new Date(),
            consecutiveFailures: 1,
            isAuthError: false,
            latency: Date.now() - startTime,
            needsRefresh: false,
            errorMessage: apiError instanceof Error ? apiError.message : 'Network error'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Handle other actions here
    return new Response(
      JSON.stringify({ 
        status: 'critical',
        isValid: false,
        expiresAt: null,
        username: null,
        lastCheck: new Date(),
        consecutiveFailures: 1,
        isAuthError: false,
        latency: null,
        needsRefresh: false,
        errorMessage: `Unknown action: ${action}`
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
        status: 'critical',
        isValid: false,
        expiresAt: null,
        username: null,
        lastCheck: new Date(),
        consecutiveFailures: 1,
        isAuthError: false,
        latency: null,
        needsRefresh: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
