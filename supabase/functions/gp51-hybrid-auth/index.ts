
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { md5_for_gp51_only } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthRequest {
  action: 'authenticate' | 'verify';
  username?: string;
  password?: string;
  token?: string;
}

function constructGP51ApiUrl(baseUrl: string, endpoint: string = '/webapi'): string {
  console.log(`🔧 [URL] Starting URL construction with base: "${baseUrl}", endpoint: "${endpoint}"`);
  
  let cleanBaseUrl = baseUrl;
  
  // Ensure protocol is present
  if (!cleanBaseUrl.startsWith('http://') && !cleanBaseUrl.startsWith('https://')) {
    cleanBaseUrl = 'https://' + cleanBaseUrl;
    console.log(`🔧 [URL] Added protocol: "${cleanBaseUrl}"`);
  }
  
  // Remove trailing slash from base URL
  if (cleanBaseUrl.endsWith('/')) {
    cleanBaseUrl = cleanBaseUrl.slice(0, -1);
    console.log(`🔧 [URL] Removed trailing slash: "${cleanBaseUrl}"`);
  }
  
  // Check if base URL already contains the endpoint path
  if (cleanBaseUrl.includes('/webapi')) {
    console.log(`🔧 [URL] Base URL already contains /webapi, using as-is: "${cleanBaseUrl}"`);
    return cleanBaseUrl;
  }
  
  // Construct final URL
  const finalUrl = cleanBaseUrl + endpoint;
  console.log(`🔧 [URL] Final constructed URL: "${finalUrl}"`);
  
  return finalUrl;
}

serve(async (req) => {
  console.log(`📥 [REQUEST] ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Environment validation with detailed logging
    console.log('🔍 [ENV DEBUG] Environment variables check:');
    const GP51_API_BASE_URL = Deno.env.get('GP51_API_BASE_URL');
    const GP51_BASE_URL = Deno.env.get('GP51_BASE_URL');
    const GP51_GLOBAL_API_TOKEN = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log(`  - GP51_API_BASE_URL: ${GP51_API_BASE_URL ? 'SET' : 'NOT SET'}`);
    console.log(`  - GP51_BASE_URL: ${GP51_BASE_URL ? 'SET' : 'NOT SET'}`);
    console.log(`  - GP51_GLOBAL_API_TOKEN: ${GP51_GLOBAL_API_TOKEN ? 'SET' : 'NOT SET'}`);
    console.log(`  - SUPABASE_URL: ${SUPABASE_URL ? 'SET' : 'NOT SET'}`);
    console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'}`);

    const { action, username, password, token }: AuthRequest = await req.json();
    
    console.log(`📋 [REQUEST] Action: ${action}, Username: ${username ? username.substring(0, 3) + '***' : 'N/A'}`);
    
    // Get client IP for logging
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    console.log(`🌍 [CLIENT] IP: ${clientIP}`);

    if (action === 'authenticate') {
      if (!username || !password) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Username and password are required' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return await authenticateWithGP51(username, password);
    }

    if (action === 'verify') {
      if (!token) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token is required for verification' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return await verifyGP51Token(token);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Invalid action' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [ERROR] Edge function error:', error);
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

async function authenticateWithGP51(username: string, password: string) {
  console.log('🔐 [AUTH] Starting GP51 authentication for user:', username);
  
  try {
    // Step 1: Environment variable validation
    console.log('🔄 [AUTH] Step 1: Validating environment variables');
    
    const rawBaseUrl = Deno.env.get('GP51_API_BASE_URL') || Deno.env.get('GP51_BASE_URL');
    const globalApiToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    
    if (!rawBaseUrl) {
      console.error('❌ [AUTH] No GP51 base URL found in environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 base URL not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!globalApiToken) {
      console.error('❌ [AUTH] GP51 global API token not found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 API token not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`🌐 [GP51] Using base URL: ${rawBaseUrl}`);
    console.log(`🔑 [GP51] Global API token found (length: ${globalApiToken.length})`);
    
    // Step 2: Generate MD5 hash for GP51 API
    console.log('🔄 [AUTH] Step 2: Generating MD5 hash for GP51 API');
    const hashedPassword = await md5_for_gp51_only(password);
    console.log(`🔐 [AUTH] Password hashed successfully (hash: ${hashedPassword.substring(0, 8)}...)`);
    
    // Step 3: Construct GP51 API URL with enhanced logic
    console.log('🔄 [AUTH] Step 3: Constructing GP51 API URL');
    const baseApiUrl = constructGP51ApiUrl(rawBaseUrl);
    
    const loginUrl = new URL(baseApiUrl);
    loginUrl.searchParams.set('action', 'login');
    loginUrl.searchParams.set('token', globalApiToken);
    loginUrl.searchParams.set('username', username);
    loginUrl.searchParams.set('password', hashedPassword);
    loginUrl.searchParams.set('from', 'web');
    loginUrl.searchParams.set('type', 'user');
    
    const redactedUrl = loginUrl.toString().replace(globalApiToken, '[REDACTED_TOKEN]');
    console.log('🌐 [AUTH] GP51 API URL constructed:', redactedUrl);
    
    // Step 4: Make HTTP request to GP51 API
    console.log('🔄 [AUTH] Step 4: Making HTTP request to GP51 API');
    
    console.log('📡 [HTTP] Request details:');
    console.log('  - Method: GET');
    console.log(`  - URL: ${redactedUrl}`);
    console.log('  - Headers: Accept=text/plain, User-Agent=FleetIQ/1.0');
    console.log('  - Timeout: 15000ms');
    
    const response = await fetch(loginUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    console.log('📊 [HTTP] GP51 Response received:');
    console.log(`  - Status: ${response.status} ${response.statusText}`);
    
    const responseHeaders = Object.fromEntries(response.headers.entries());
    console.log(`  - Headers: ${JSON.stringify(responseHeaders)}`);
    console.log(`  - Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [HTTP] GP51 API returned HTTP ${response.status}: ${response.statusText}`);
      console.error(`❌ [HTTP] Error response body: ${errorText.substring(0, 200)}`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `GP51 API error: ${response.status} ${response.statusText}`,
          details: errorText.substring(0, 200)
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const responseText = await response.text();
    console.log(`📊 [HTTP] Response body length: ${responseText.length}`);
    console.log(`📊 [HTTP] Response preview: ${responseText.substring(0, 100)}`);

    // Step 5: Validate GP51 response
    console.log('🔄 [AUTH] Step 5: Validating GP51 response');
    
    const trimmedResponse = responseText.trim();
    
    // Enhanced response validation
    const isValidResponse = trimmedResponse.length >= 10 && 
                           !trimmedResponse.toLowerCase().includes('error') && 
                           !trimmedResponse.toLowerCase().includes('fail') && 
                           !trimmedResponse.toLowerCase().includes('invalid') &&
                           !trimmedResponse.toLowerCase().includes('denied');

    if (!isValidResponse) {
      console.error('❌ [AUTH] GP51 authentication failed - invalid response:', trimmedResponse.substring(0, 100));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid GP51 credentials',
          details: trimmedResponse.substring(0, 100)
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const sessionToken = trimmedResponse;
    console.log(`✅ [AUTH] GP51 authentication successful for ${username}`);
    console.log(`✅ [AUTH] Session token received (length: ${sessionToken.length})`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        token: sessionToken,
        username: username,
        method: 'ENHANCED_GP51_API'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [AUTH] GP51 authentication failed:', error);
    
    if (error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 connection timed out. Please try again.' 
        }),
        { 
          status: 408, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed',
        details: error instanceof Error ? error.stack : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function verifyGP51Token(token: string) {
  console.log('🔍 [VERIFY] Starting GP51 token verification');
  
  try {
    const rawBaseUrl = Deno.env.get('GP51_API_BASE_URL') || Deno.env.get('GP51_BASE_URL');
    const globalApiToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    
    if (!rawBaseUrl || !globalApiToken) {
      console.error('❌ [VERIFY] Missing environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 configuration missing' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const baseApiUrl = constructGP51ApiUrl(rawBaseUrl);
    
    // Use a simple API call to verify token validity
    const verifyUrl = new URL(baseApiUrl);
    verifyUrl.searchParams.set('action', 'getmonitorlist');
    verifyUrl.searchParams.set('token', globalApiToken);
    verifyUrl.searchParams.set('usertoken', token);
    
    const response = await fetch(verifyUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });

    console.log(`📊 [VERIFY] Response status: ${response.status}`);

    if (response.ok) {
      const responseText = await response.text();
      console.log('✅ [VERIFY] Token verification successful');
      
      return new Response(
        JSON.stringify({ 
          success: true,
          valid: true,
          token: token
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.error('❌ [VERIFY] Token verification failed');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired token' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('❌ [VERIFY] Token verification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Token verification failed' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
