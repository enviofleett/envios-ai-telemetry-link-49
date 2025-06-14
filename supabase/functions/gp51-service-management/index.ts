import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Md5 } from "https://deno.land/std@0.224.0/crypto/md5.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GP51_API_URL = "https://www.gps51.com/webapi";

// Updated MD5 hash function using Deno standard library
function calculateMd5(input: string): string {
  const md5hasher = new Md5();
  md5hasher.update(input);
  return md5hasher.toString();
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
    console.log(`GP51 Service Management API call: Action: ${action}`);

    if (action === 'test_connection') {
      console.log('Testing GP51 connection by validating session...');
      const startTime = Date.now();
      
      // Check if we have any valid GP51 sessions
      const { data: session, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, password_hash, token_expires_at, api_url')
        .order('token_expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

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

      if (!session) {
        console.log('No GP51 sessions found - GP51 not configured');
        return new Response(
          JSON.stringify({ 
            status: 'not_configured',
            isValid: false,
            expiresAt: null,
            username: null,
            lastCheck: new Date(),
            consecutiveFailures: 0,
            isAuthError: false,
            latency: Date.now() - startTime,
            needsRefresh: false,
            errorMessage: 'GP51 integration not configured. Please add GP51 credentials in admin settings.'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

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
      console.log('✅ GP51 session validation successful for test_connection action');
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
      const { data: session, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, password_hash, token_expires_at, api_url') // password_hash should be the actual password
        .order('token_expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        console.error('Database error during session check (test_gp51_api):', sessionError);
        return new Response(
          JSON.stringify({ 
            status: 'critical',
            isValid: false,
            latency: Date.now() - startTime,
            errorMessage: 'Database connection failed while fetching session for API test.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!session) {
        console.log('No GP51 sessions found - GP51 not configured (test_gp51_api)');
        return new Response(
          JSON.stringify({ 
            status: 'not_configured',
            isValid: false,
            latency: Date.now() - startTime,
            errorMessage: 'GP51 integration not configured. Cannot test API.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const expiresAt = new Date(session.token_expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        console.error('GP51 session expired (test_gp51_api):', { expiresAt, now });
        return new Response(
          JSON.stringify({ 
            status: 'critical',
            isValid: false,
            username: session.username,
            expiresAt: expiresAt,
            isAuthError: true,
            latency: Date.now() - startTime,
            needsRefresh: true,
            errorMessage: 'GP51 session expired. Cannot test API.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash password for authentication using Deno's MD5
      try {
        // Assuming session.password_hash stores the plain password
        const hashedPassword = calculateMd5(session.password_hash); 
        console.log(`Authenticating with GP51 username: ${session.username}`);
        
        const formData = new URLSearchParams({
          action: 'querymonitorlist',
          username: session.username,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER'
        });

        const apiUrlToUse = session.api_url || GP51_API_URL;
        console.log(`📡 Making real GP51 API call to: ${apiUrlToUse} (action: querymonitorlist)`);
        
        const testResponse = await fetch(apiUrlToUse, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'EnvioFleet/1.0 Deno/Test'
          },
          body: formData.toString()
        });

        const responseLatency = Date.now() - startTime;
        console.log("GP51 API call result status:", testResponse.status);

        if (!testResponse.ok) {
          const errorText = await testResponse.text().catch(() => "Could not read error response body");
          console.error('❌ GP51 API HTTP error:', testResponse.status, errorText);
          return new Response(
            JSON.stringify({ 
              status: 'critical',
              isValid: false,
              username: session.username,
              latency: responseLatency,
              isAuthError: testResponse.status === 401 || testResponse.status === 403,
              errorMessage: `GP51 API HTTP error: ${testResponse.status}. Response: ${errorText.substring(0,100)}`
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const responseText = await testResponse.text();
        console.log('📊 Raw GP51 API response (test_gp51_api):', responseText.substring(0, 200) + '...');
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ GP51 API response JSON parse error:', parseError.message);
          return new Response(
            JSON.stringify({ 
              status: 'critical',
              isValid: false,
              username: session.username,
              latency: responseLatency,
              errorMessage: `GP51 API response was not valid JSON: ${responseText.substring(0,100)}`
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }


        if (responseData.status !== 0) {
          console.error('❌ GP51 API returned error status:', responseData);
          return new Response(
            JSON.stringify({ 
              status: 'critical',
              isValid: false,
              username: session.username,
              latency: responseLatency,
              isAuthError: true, // Typically API errors with status != 0 are auth related
              errorMessage: responseData.message || responseData.cause || `GP51 API logic error (status: ${responseData.status})`
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const needsRefresh = timeUntilExpiry < 10 * 60 * 1000; // 10 minutes

        console.log('✅ GP51 API test successful (test_gp51_api)');
        return new Response(
          JSON.stringify({ 
            status: needsRefresh ? 'degraded' : 'healthy',
            isValid: true,
            username: session.username,
            expiresAt: expiresAt,
            latency: responseLatency,
            needsRefresh: needsRefresh,
            errorMessage: null,
            deviceCount: responseData.groups ? responseData.groups.reduce((acc: number, group: any) => acc + (group.devices ? group.devices.length : 0), 0) : (responseData.devices ? responseData.devices.length : 0),
            details: `Successfully connected to GP51 as ${session.username}. API responded in ${responseLatency}ms.`
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (apiError) {
        console.error('❌ GP51 API connection processing failed (test_gp51_api):', apiError);
        return new Response(
          JSON.stringify({ 
            status: 'critical',
            isValid: false,
            username: session?.username, 
            latency: Date.now() - startTime,
            errorMessage: apiError instanceof Error ? apiError.message : 'General error during API test.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle other actions here
    console.warn(`Unknown action received: ${action}`);
    return new Response(
      JSON.stringify({ 
        status: 'critical',
        isValid: false,
        errorMessage: `Unknown action: ${action}`
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('GP51 Service Management unhandled error:', error);
    return new Response(
      JSON.stringify({ 
        status: 'critical',
        isValid: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
