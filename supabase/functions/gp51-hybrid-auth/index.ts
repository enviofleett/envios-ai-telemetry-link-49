
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_for_gp51_only, checkRateLimit } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`📥 [REQUEST] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    console.log('📥 [REQUEST] OPTIONS - returning CORS headers');
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  console.log(`🌍 [CLIENT] IP: ${clientIP}`);
  
  // Rate limiting
  if (!checkRateLimit(clientIP, 10, 15 * 60 * 1000)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, username, password } = body;
    console.log(`📋 [REQUEST] Action: ${action}, Username: ${username ? username.substring(0, 3) + '***' : 'undefined'}`);

    // Environment variables check
    const GP51_API_BASE_URL = Deno.env.get('GP51_API_BASE_URL');
    const GP51_BASE_URL = Deno.env.get('GP51_BASE_URL');
    const GP51_GLOBAL_API_TOKEN = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('🔍 [ENV DEBUG] Environment variables check:');
    console.log(`  - GP51_API_BASE_URL: ${GP51_API_BASE_URL ? 'SET' : 'NOT SET'}`);
    console.log(`  - GP51_BASE_URL: ${GP51_BASE_URL ? 'SET' : 'NOT SET'}`);
    console.log(`  - GP51_GLOBAL_API_TOKEN: ${GP51_GLOBAL_API_TOKEN ? 'SET' : 'NOT SET'}`);
    console.log(`  - SUPABASE_URL: ${SUPABASE_URL ? 'SET' : 'NOT SET'}`);
    console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'}`);

    switch (action) {
      case 'authenticate':
        return await authenticateWithGP51(username, password);
      
      default:
        console.warn(`❌ Unknown action: ${action}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('❌ GP51 Hybrid Auth error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function authenticateWithGP51(username: string, password: string) {
  console.log(`🔐 [AUTH] Starting GP51 authentication for user: ${username ? username.substring(0, 3) + '***' : 'undefined'}`);

  console.log('🔄 [AUTH] Step 1: Validating environment variables');
  
  // Use GP51_BASE_URL primarily, fallback to GP51_API_BASE_URL
  let gp51BaseUrl = Deno.env.get('GP51_BASE_URL') || Deno.env.get('GP51_API_BASE_URL');
  const GP51_GLOBAL_API_TOKEN = Deno.env.get('GP51_GLOBAL_API_TOKEN');

  console.log(`🌐 [GP51] Using base URL: ${gp51BaseUrl}`);
  console.log(`🔑 [GP51] Global API token found (length: ${GP51_GLOBAL_API_TOKEN ? GP51_GLOBAL_API_TOKEN.length : 0})`);

  if (!gp51BaseUrl) {
    console.error('❌ GP51_BASE_URL environment variable is not set!');
    return new Response(
      JSON.stringify({ success: false, error: 'GP51 Base URL not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  if (!GP51_GLOBAL_API_TOKEN) {
    console.error('❌ GP51_GLOBAL_API_TOKEN environment variable is not set!');
    return new Response(
      JSON.stringify({ success: false, error: 'GP51 Global API Token not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('🔄 [AUTH] Step 2: Calling GP51 authentication');

  // Ensure base URL has proper protocol and no trailing slash
  if (!gp51BaseUrl.startsWith('http://') && !gp51BaseUrl.startsWith('https://')) {
    gp51BaseUrl = 'https://' + gp51BaseUrl;
    console.warn('Prepended https:// to GP51_BASE_URL for safety.');
  }
  if (gp51BaseUrl.endsWith('/')) {
    gp51BaseUrl = gp51BaseUrl.slice(0, -1);
  }

  console.log('🔐 [GP51-AUTH] Starting authentication process');
  console.log('🔄 [GP51-AUTH] Step 1: Environment validation complete');
  console.log(`🌐 [GP51-AUTH] Using API URL: ${gp51BaseUrl}`);

  try {
    console.log('🔄 [GP51-AUTH] Step 2: Generating MD5 hash');
    console.log(`🔐 Creating MD5 hash for input of length: ${password.length}`);
    
    // Use the improved MD5 implementation for GP51 compatibility
    const gp51Hash = await md5_for_gp51_only(password);
    console.log(`✅ MD5 hash generated successfully: ${gp51Hash.substring(0, 8)}...`);
    console.log('✅ [GP51-AUTH] MD5 hash generated successfully');

    console.log('🔄 [GP51-AUTH] Step 3: Preparing login request');

    // Construct the full authentication URL with ALL parameters in the query string
    const authUrl = new URL(`${gp51BaseUrl}/webapi`);
    authUrl.searchParams.append('action', 'login');
    authUrl.searchParams.append('token', GP51_GLOBAL_API_TOKEN);
    authUrl.searchParams.append('username', username);
    authUrl.searchParams.append('password', gp51Hash);
    authUrl.searchParams.append('from', 'WEB');
    authUrl.searchParams.append('type', 'USER');

    console.log('📊 [GP51-AUTH] Login request details:');
    console.log(`  - URL: ${authUrl.toString()}`);
    console.log(`  - Username: ${username}`);
    console.log(`  - Password hash: ${gp51Hash.substring(0, 8)}...`);
    console.log(`  - From: WEB`);
    console.log(`  - Type: USER`);
    console.log(`  - Token (first 10 chars): ${GP51_GLOBAL_API_TOKEN.substring(0, 10)}...`);

    console.log('🔄 [GP51-AUTH] Step 4: Making login request to GP51');
    const authResponse = await fetch(authUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`📈 [GP51-AUTH] GP51 API Response Status: ${authResponse.status}`);
    const responseHeaders = Object.fromEntries(authResponse.headers.entries());
    console.log('📈 [GP51-AUTH] Response Headers:', JSON.stringify(responseHeaders, null, 2));

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error(`❌ [GP51-AUTH] GP51 API response not OK: ${authResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `GP51 authentication failed: HTTP ${authResponse.status}: ${errorText}` 
        }),
        { status: authResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentLength = authResponse.headers.get('content-length');
    if (authResponse.status === 200 && contentLength === '0') {
      console.error('❌ [GP51-AUTH] GP51 API returned 200 OK but with an empty response body');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 authentication failed: Empty response received' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseText = await authResponse.text();
    console.log(`📄 [GP51-AUTH] Raw response length: ${responseText.length}`);
    console.log(`📄 [GP51-AUTH] Raw response preview: ${responseText.substring(0, 200)}`);

    let authResult;
    try {
      authResult = JSON.parse(responseText);
      console.log('📊 [GP51-AUTH] Parsed response data:', JSON.stringify(authResult, null, 2));
    } catch (parseError) {
      console.error('❌ [GP51-AUTH] Failed to parse response as JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 authentication failed: Invalid response format' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for GP51's internal status code (0 for success) and presence of token
    if (authResult && authResult.status === 0 && authResult.token) {
      console.log('✅ [GP51-AUTH] GP51 authentication successful');
      return new Response(
        JSON.stringify({ 
          success: true,
          token: authResult.token,
          username: authResult.username || username,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          method: 'GET_URL_PARAMS'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('❌ [GP51-AUTH] GP51 authentication failed:', authResult.cause || 'Unknown error');
      const errorMessage = authResult.cause || 'Authentication failed based on GP51 response status';
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `GP51 authentication failed: ${errorMessage}`,
          details: authResult
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ [GP51-AUTH] Unexpected error during authentication:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `GP51 authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
