
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_for_gp51_only, checkRateLimit, sanitizeInput, isValidUsername } from "../_shared/crypto_utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variable debugging
function debugEnvironmentVariables(): void {
  console.log('🔍 [ENV DEBUG] Environment variables check:');
  console.log(`  - GP51_API_BASE_URL: ${Deno.env.get('GP51_API_BASE_URL') ? 'SET' : 'NOT SET'}`);
  console.log(`  - GP51_BASE_URL: ${Deno.env.get('GP51_BASE_URL') ? 'SET' : 'NOT SET'}`);
  console.log(`  - GP51_GLOBAL_API_TOKEN: ${Deno.env.get('GP51_GLOBAL_API_TOKEN') ? 'SET' : 'NOT SET'}`);
  console.log(`  - SUPABASE_URL: ${Deno.env.get('SUPABASE_URL') ? 'SET' : 'NOT SET'}`);
  console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'NOT SET'}`);
}

function getGP51BaseUrl(): string {
  // Try both environment variable names for compatibility
  const url = Deno.env.get('GP51_API_BASE_URL') || Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
  console.log(`🌐 [GP51] Using base URL: ${url}`);
  return url;
}

function getGP51GlobalToken(): string | null {
  const token = Deno.env.get('GP51_GLOBAL_API_TOKEN');
  if (token) {
    console.log(`🔑 [GP51] Global API token found (length: ${token.length})`);
    return token;
  } else {
    console.error('❌ [GP51] GP51_GLOBAL_API_TOKEN environment variable not found');
    return null;
  }
}

serve(async (req) => {
  console.log(`📥 [REQUEST] ${req.method} ${req.url}`);
  debugEnvironmentVariables();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  console.log(`🌍 [CLIENT] IP: ${clientIP}`);
  
  // Rate limiting
  if (!checkRateLimit(clientIP, 5, 15 * 60 * 1000)) {
    console.warn(`⚠️ [RATE LIMIT] Too many requests from ${clientIP}`);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Too many requests. Please try again later.' 
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => null);
    if (!body) {
      console.error('❌ [REQUEST] Invalid JSON in request body');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 [REQUEST] Action: ${body.action}, Username: ${body.username ? body.username.substring(0, 3) + '***' : 'NOT PROVIDED'}`);

    const { action, username, password } = body;

    if (action === 'authenticate') {
      return await authenticateWithGP51(username, password, supabase);
    }

    console.warn(`❌ [REQUEST] Unknown action: ${action}`);
    return new Response(JSON.stringify({
      success: false,
      error: `Unknown action: ${action}`
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [SYSTEM] GP51 Hybrid Auth error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function authenticateWithGP51(username: string, password: string, supabase: any) {
  const trimmedUsername = sanitizeInput(username);
  console.log(`🔐 [AUTH] Starting GP51 authentication for user: ${trimmedUsername}`);
  
  if (!isValidUsername(trimmedUsername)) {
    console.error(`❌ [AUTH] Invalid username format: ${trimmedUsername}`);
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid username format'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('🔄 [AUTH] Step 1: Validating environment variables');
    
    const gp51BaseUrl = getGP51BaseUrl();
    const globalApiToken = getGP51GlobalToken();
    
    if (!globalApiToken) {
      console.error('❌ [AUTH] GP51_GLOBAL_API_TOKEN not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 API configuration missing'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🔄 [AUTH] Step 2: Generating MD5 hash for GP51 API');
    const gp51Hash = await md5_for_gp51_only(password);
    console.log(`🔐 [AUTH] Password hashed successfully (hash: ${gp51Hash.substring(0, 8)}...)`);
    
    console.log('🔄 [AUTH] Step 3: Constructing GP51 API URL');
    const apiUrl = new URL(`${gp51BaseUrl}/webapi`);
    apiUrl.searchParams.set('action', 'login');
    apiUrl.searchParams.set('token', globalApiToken);
    apiUrl.searchParams.set('username', trimmedUsername);
    apiUrl.searchParams.set('password', gp51Hash);
    apiUrl.searchParams.set('from', 'web');
    apiUrl.searchParams.set('type', 'user');
    
    const redactedUrl = apiUrl.toString().replace(globalApiToken, '[REDACTED_TOKEN]');
    console.log(`🌐 [AUTH] GP51 API URL constructed: ${redactedUrl}`);
    
    console.log('🔄 [AUTH] Step 4: Making HTTP request to GP51 API');
    console.log(`📡 [HTTP] Request details:`);
    console.log(`  - Method: GET`);
    console.log(`  - URL: ${redactedUrl}`);
    console.log(`  - Headers: Accept=text/plain, User-Agent=FleetIQ/1.0`);
    console.log(`  - Timeout: 15000ms`);
    
    const authResponse = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    console.log(`📊 [HTTP] GP51 Response received:`);
    console.log(`  - Status: ${authResponse.status} ${authResponse.statusText}`);
    console.log(`  - Headers: ${JSON.stringify(Object.fromEntries(authResponse.headers.entries()))}`);
    console.log(`  - Content-Type: ${authResponse.headers.get('content-type')}`);

    if (!authResponse.ok) {
      console.error(`❌ [HTTP] GP51 API returned HTTP ${authResponse.status}: ${authResponse.statusText}`);
      
      // Try to get response body for more details
      let errorBody = '';
      try {
        errorBody = await authResponse.text();
        console.error(`❌ [HTTP] Error response body: ${errorBody.substring(0, 200)}`);
      } catch (e) {
        console.error(`❌ [HTTP] Could not read error response body: ${e}`);
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: `GP51 API error: ${authResponse.status} ${authResponse.statusText}`,
        details: errorBody.substring(0, 100)
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔄 [AUTH] Step 5: Processing GP51 response');
    const authResult = await authResponse.text();
    console.log(`📊 [AUTH] GP51 Response Body (length: ${authResult.length}):`);
    console.log(`  - First 200 chars: ${authResult.substring(0, 200)}`);
    console.log(`  - Contains 'error': ${authResult.toLowerCase().includes('error')}`);
    console.log(`  - Contains 'fail': ${authResult.toLowerCase().includes('fail')}`);
    console.log(`  - Contains 'invalid': ${authResult.toLowerCase().includes('invalid')}`);
    
    // Enhanced validation of GP51 response
    const trimmedResult = authResult.trim();
    const isValidResponse = trimmedResult.length >= 10 && 
                           !trimmedResult.toLowerCase().includes('error') && 
                           !trimmedResult.toLowerCase().includes('fail') && 
                           !trimmedResult.toLowerCase().includes('invalid') &&
                           !trimmedResult.toLowerCase().includes('denied');
    
    if (!isValidResponse) {
      console.error(`❌ [AUTH] GP51 authentication failed - invalid response: ${trimmedResult}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid GP51 credentials',
        details: trimmedResult.substring(0, 100)
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sessionToken = trimmedResult;
    console.log(`✅ [AUTH] GP51 authentication successful`);
    console.log(`  - Session token length: ${sessionToken.length}`);
    console.log(`  - Session token preview: ${sessionToken.substring(0, 16)}...`);

    console.log('🔄 [AUTH] Step 6: Creating/updating user in database');
    const { data: user, error: userError } = await supabase
      .from('envio_users')
      .upsert({
        username: trimmedUsername,
        email: `${trimmedUsername}@gp51.local`,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'username'
      })
      .select()
      .single();

    if (userError) {
      console.warn(`⚠️ [DATABASE] Failed to create/update user: ${userError.message}`);
    } else {
      console.log(`✅ [DATABASE] User created/updated successfully: ${user?.id}`);
    }

    console.log('🔄 [AUTH] Step 7: Storing GP51 session');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const { error: sessionError } = await supabase
      .from('gp51_sessions')
      .upsert({
        username: trimmedUsername,
        gp51_token: sessionToken,
        token_expires_at: expiresAt.toISOString(),
        last_validated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'username'
      });

    if (sessionError) {
      console.warn(`⚠️ [DATABASE] Failed to store GP51 session: ${sessionError.message}`);
    } else {
      console.log(`✅ [DATABASE] GP51 session stored successfully`);
    }

    console.log('🎉 [AUTH] GP51 authentication and session storage completed successfully');

    return new Response(JSON.stringify({
      success: true,
      token: sessionToken,
      username: trimmedUsername,
      expiresAt: expiresAt.toISOString(),
      user,
      session: { 
        token: sessionToken, 
        expiresAt: expiresAt.toISOString(),
        username: trimmedUsername 
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [AUTH] GP51 authentication failed with exception:', error);
    console.error('❌ [AUTH] Error stack:', error.stack);
    
    if (error.name === 'AbortError') {
      console.error('❌ [AUTH] Request timed out after 15 seconds');
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 connection timed out. Please try again.'
      }), {
        status: 408,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      details: error instanceof Error ? error.stack : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
