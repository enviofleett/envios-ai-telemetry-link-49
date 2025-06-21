
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_for_gp51_only } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📥 [REQUEST] OPTIONS - returning CORS headers');
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`📥 [REQUEST] ${req.method} ${req.url}`);
  
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  console.log(`🌍 [CLIENT] IP: ${clientIP}`);

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, username, password } = body;
    console.log(`📋 [REQUEST] Action: ${action}, Username: ${username ? username.substring(0, 3) + '***' : 'NOT_SET'}`);

    if (action !== 'authenticate') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action. Only "authenticate" is supported.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Environment validation
    console.log('🔄 [AUTH] Step 1: Validating environment variables');
    
    let gp51BaseUrl = Deno.env.get('GP51_API_BASE_URL') || Deno.env.get('GP51_BASE_URL');
    const GP51_GLOBAL_API_TOKEN = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    
    console.log('🔍 [ENV DEBUG] Environment variables check:');
    console.log(`  - GP51_API_BASE_URL: ${Deno.env.get('GP51_API_BASE_URL') ? 'SET' : 'NOT SET'}`);
    console.log(`  - GP51_BASE_URL: ${Deno.env.get('GP51_BASE_URL') ? 'SET' : 'NOT SET'}`);
    console.log(`  - GP51_GLOBAL_API_TOKEN: ${GP51_GLOBAL_API_TOKEN ? 'SET' : 'NOT SET'}`);
    console.log(`  - SUPABASE_URL: ${Deno.env.get('SUPABASE_URL') ? 'SET' : 'NOT SET'}`);
    console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'NOT SET'}`);

    if (!gp51BaseUrl) {
      gp51BaseUrl = 'https://www.gps51.com/webapi';
      console.log('🌐 [GP51] Using default base URL: https://www.gps51.com/webapi');
    } else {
      console.log(`🌐 [GP51] Using base URL: ${gp51BaseUrl}`);
    }

    if (!GP51_GLOBAL_API_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: 'GP51 Global API Token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔑 [GP51] Global API token found (length: ${GP51_GLOBAL_API_TOKEN.length})`);

    console.log('🔐 [AUTH] Starting GP51 authentication for user: ' + username.substring(0, 3) + '***');

    // Call GP51 authentication
    console.log('🔄 [AUTH] Step 2: Calling GP51 authentication');
    const authResult = await authenticateWithGP51(gp51BaseUrl, GP51_GLOBAL_API_TOKEN, username, password);

    if (authResult.success) {
      return new Response(
        JSON.stringify(authResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify(authResult),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ [ERROR] Unhandled error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function authenticateWithGP51(baseUrl: string, globalToken: string, username: string, password: string) {
  console.log('🔄 [GP51-AUTH] Step 1: Environment validation complete');
  console.log(`🌐 [GP51-AUTH] Using API URL: ${baseUrl}`);

  try {
    // Step 2: Generate MD5 hash
    console.log('🔄 [GP51-AUTH] Step 2: Generating MD5 hash');
    console.log(`🔐 Creating MD5 hash for input of length: ${password.length}`);
    
    const passwordHash = await md5_for_gp51_only(password);
    console.log('✅ [GP51-AUTH] MD5 hash generated successfully');

    // Step 3: Prepare login request
    console.log('🔄 [GP51-AUTH] Step 3: Preparing login request');

    // --- START FIX FOR PATH DUPLICATION ROBUSTNESS ---
    let finalApiUrlPath = baseUrl;
    
    // Ensure base URL has a proper protocol
    if (!finalApiUrlPath.startsWith('http://') && !finalApiUrlPath.startsWith('https://')) {
      finalApiUrlPath = 'https://' + finalApiUrlPath;
      console.warn('Prepended https:// to GP51_BASE_URL for safety.');
    }
    
    // Remove trailing slash if present
    if (finalApiUrlPath.endsWith('/')) {
      finalApiUrlPath = finalApiUrlPath.slice(0, -1);
    }
    
    // Intelligently append /webapi only if it's not already part of the URL
    if (!finalApiUrlPath.endsWith('/webapi')) {
      finalApiUrlPath += '/webapi';
    }
    
    const authUrl = new URL(finalApiUrlPath);
    // --- END FIX FOR PATH DUPLICATION ROBUSTNESS ---

    authUrl.searchParams.append('action', 'login');
    authUrl.searchParams.append('token', globalToken);
    authUrl.searchParams.append('username', username);
    authUrl.searchParams.append('password', passwordHash);
    authUrl.searchParams.append('from', 'WEB');
    authUrl.searchParams.append('type', 'USER');

    console.log('📊 [GP51-AUTH] Login request details:');
    console.log(`  - URL: ${authUrl.toString()}`);
    console.log(`  - Username: ${username}`);
    console.log(`  - Password hash: ${passwordHash.substring(0, 8)}...`);
    console.log(`  - From: WEB`);
    console.log(`  - Type: USER`);
    console.log(`  - Token (first 10 chars): ${globalToken.substring(0, 10)}...`);

    // Step 4: Make login request
    console.log('🔄 [GP51-AUTH] Step 4: Making login request to GP51');

    const response = await fetch(authUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`📈 [GP51-AUTH] GP51 API Response Status: ${response.status}`);
    
    const responseHeaders = Object.fromEntries(response.headers.entries());
    console.log(`📈 [GP51-AUTH] Response Headers: ${JSON.stringify(responseHeaders, null, 2)}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [GP51-AUTH] GP51 API response not OK: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `GP51 API returned ${response.status}: ${errorText}`,
        status: response.status
      };
    }

    // Handle successful response
    const responseText = await response.text();
    console.log(`📄 [GP51-AUTH] Raw Response: ${responseText}`);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`✅ [GP51-AUTH] Parsed JSON Response: ${JSON.stringify(responseData)}`);
    } catch (parseError) {
      console.log(`📝 [GP51-AUTH] Response is not JSON, treating as plain text token: ${responseText}`);
      // If response is not JSON, treat it as a token
      if (responseText && responseText.trim().length > 0) {
        return {
          success: true,
          token: responseText.trim(),
          message: 'Authentication successful',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
      } else {
        return {
          success: false,
          error: 'Empty response from GP51 API'
        };
      }
    }

    // Handle JSON response
    if (responseData && responseData.status === 0 && responseData.token) {
      console.log('✅ [GP51-AUTH] Authentication successful with JSON response');
      return {
        success: true,
        token: responseData.token,
        message: 'Authentication successful',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        gp51Response: responseData
      };
    } else if (responseData && responseData.status !== undefined) {
      console.error(`❌ [GP51-AUTH] GP51 authentication failed with status: ${responseData.status}`);
      return {
        success: false,
        error: `GP51 authentication failed: ${responseData.cause || 'Unknown error'}`,
        gp51Status: responseData.status
      };
    } else {
      console.error('❌ [GP51-AUTH] Unexpected response format from GP51');
      return {
        success: false,
        error: 'Unexpected response format from GP51 API'
      };
    }

  } catch (error) {
    console.error('❌ [GP51-AUTH] Exception during authentication:', error);
    return {
      success: false,
      error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
