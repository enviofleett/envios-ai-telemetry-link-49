
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const GP51_API_URL = "https://www.gps51.com/webapi";
const REQUEST_TIMEOUT = 5000; // 5 seconds
const MAX_RETRIES = 2;

// MD5 hash function for password hashing
async function md5(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function callGP51WithRetry(
  formData: URLSearchParams, 
  attempt: number = 1
): Promise<{ success: boolean; response?: Response; error?: string; statusCode?: number }> {
  try {
    console.log(`GP51 API call attempt ${attempt}/${MAX_RETRIES + 1}`);
    console.log('Form data:', Object.fromEntries(formData.entries()));
    
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
    console.log(`GP51 API response: status=${response.status}`);
    
    return { success: true, response, statusCode: response.status };
    
  } catch (error) {
    console.error(`GP51 API attempt ${attempt} failed:`, error);
    
    if (attempt <= MAX_RETRIES) {
      const delay = attempt * 1000; // Exponential backoff: 1s, 2s
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGP51WithRetry(formData, attempt + 1);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error',
      statusCode: 0
    };
  }
}

serve(async (req) => {
  console.log(`GP51 Connection Check: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the most recent GP51 session
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('username, gp51_password, token_expires_at, api_url')
      .order('token_expires_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error('Database error during session check:', sessionError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Database connection failed',
          details: sessionError.message,
          statusCode: 500,
          isAuthError: false,
          latency: Date.now() - startTime
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
          details: 'Please configure GP51 credentials first',
          statusCode: 404,
          isAuthError: true,
          latency: Date.now() - startTime
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
          details: 'Session expired, please re-authenticate',
          statusCode: 401,
          isAuthError: true,
          latency: Date.now() - startTime,
          username: session.username
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Hash the password for GP51 authentication
    const hashedPassword = await md5(session.gp51_password);
    
    // Test GP51 API connectivity using login action
    const formData = new URLSearchParams({
      action: 'login',
      username: session.username,
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    });

    console.log('Testing GP51 connectivity with login action...');
    const result = await callGP51WithRetry(formData);
    const latency = Date.now() - startTime;

    if (!result.success) {
      console.error('All GP51 API attempts failed. Network unreachable.');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'GP51 API unreachable',
          details: result.error || 'Network connectivity issues',
          statusCode: result.statusCode || 0,
          isAuthError: false,
          latency,
          recommendation: 'Consider using a Node.js proxy or upgrading hosting environment'
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const response = result.response!;
    const responseText = await response.text();
    console.log('GP51 API raw response:', responseText.substring(0, 200) + '...');
    
    if (!response.ok) {
      console.error(`GP51 API HTTP error: ${response.status} ${response.statusText}`);
      
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'GP51 authentication failed',
            details: `HTTP ${response.status}: Invalid credentials`,
            statusCode: response.status,
            isAuthError: true,
            latency,
            username: session.username
          }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'GP51 API error',
          details: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          isAuthError: false,
          latency
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GP51 response as JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid response format',
          details: 'GP51 API returned invalid JSON',
          statusCode: response.status,
          isAuthError: false,
          latency
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check GP51 authentication result
    if (responseData.status !== 0 || !responseData.token) {
      console.error('GP51 authentication failed:', responseData);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'GP51 authentication failed',
          details: responseData.cause || responseData.message || 'Invalid credentials',
          statusCode: response.status,
          isAuthError: true,
          latency,
          username: session.username
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Success!
    console.log('✅ GP51 connection test successful');
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'GP51 connection successful',
        details: 'Authentication and API connectivity verified',
        statusCode: response.status,
        isAuthError: false,
        latency,
        username: session.username,
        token: responseData.token ? '[PRESENT]' : '[MISSING]'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('GP51 Connection Check error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500,
        isAuthError: false,
        latency: Date.now() - startTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
