
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const GP51_API_URL = "https://api.gpstrackerxy.com/api";
const REQUEST_TIMEOUT = 5000; // 5 seconds
const MAX_RETRIES = 2;

serve(async (req) => {
  console.log(`GP51 Connection Check: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the most recent GP51 session
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
          details: sessionError.message
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!sessions || sessions.length === 0) {
      console.log('No GP51 sessions found in database');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No GP51 sessions configured',
          details: 'Please configure GP51 credentials first'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const session = sessions[0];
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      console.log('GP51 session expired:', { expiresAt, now });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'GP51 session expired',
          details: 'Session expired, please re-authenticate'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Test GP51 API connectivity with retries
    const startTime = Date.now();
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        console.log(`GP51 API test attempt ${attempt}/${MAX_RETRIES + 1}`);
        
        // Prepare form data as URLSearchParams
        const formData = new URLSearchParams({
          action: 'querymonitorlist',
          json: '1',
          suser: session.username,
          stoken: session.gp51_token
        });

        console.log('Making GP51 API request with params:', {
          action: 'querymonitorlist',
          json: '1',
          suser: session.username,
          stoken: '[REDACTED]'
        });

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const response = await fetch(GP51_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'EnvioFleet/1.0'
          },
          body: formData.toString(),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        const latency = Date.now() - startTime;
        console.log(`GP51 API response: status=${response.status}, latency=${latency}ms`);

        if (!response.ok) {
          console.error(`GP51 API HTTP error: ${response.status} ${response.statusText}`);
          
          if (response.status === 401 || response.status === 403) {
            return new Response(
              JSON.stringify({ 
                success: false,
                error: 'GP51 authentication failed',
                details: `HTTP ${response.status}: Invalid credentials`,
                latency
              }),
              { 
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log('GP51 API raw response:', responseText.substring(0, 200) + '...');
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse GP51 response as JSON:', parseError);
          throw new Error('Invalid JSON response from GP51 API');
        }

        // Check if GP51 returned an error
        if (responseData.result === "false" || responseData.result === false) {
          console.error('GP51 API logic error:', responseData);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'GP51 API authentication failed',
              details: responseData.message || 'Invalid session token',
              latency
            }),
            { 
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Success!
        console.log('✅ GP51 API connection test successful');
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'GP51 connection successful',
            latency,
            deviceCount: responseData.devices ? responseData.devices.length : 0,
            username: session.username
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      } catch (error) {
        lastError = error as Error;
        console.error(`GP51 API attempt ${attempt} failed:`, error);
        
        // If this is the last attempt, don't wait
        if (attempt <= MAX_RETRIES) {
          const delay = attempt * 1000; // Exponential backoff: 1s, 2s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    const latency = Date.now() - startTime;
    console.error('All GP51 API attempts failed. Last error:', lastError);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'GP51 API unreachable',
        details: lastError?.message || 'Network connectivity issues',
        latency,
        recommendation: 'Consider using a Node.js proxy or upgrading hosting environment'
      }),
      { 
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('GP51 Connection Check error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
