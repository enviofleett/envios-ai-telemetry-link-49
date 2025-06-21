
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_for_gp51_only } from '../_shared/crypto_utils.ts';

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

  try {
    const body = await req.json();
    const { action, username, password } = body;

    console.log(`🌍 [CLIENT] IP: ${req.headers.get('x-forwarded-for') || 'unknown'}`);
    console.log(`📋 [REQUEST] Action: ${action}, Username: ${username?.substring(0, 3)}***`);

    if (action === 'authenticate') {
      return await authenticateWithGP51(username, password);
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [ERROR] Request processing failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function authenticateWithGP51(username: string, password: string) {
  console.log('🔄 [AUTH] Step 1: Validating environment variables');
  
  // Environment variable validation with detailed logging
  const gp51BaseUrl = Deno.env.get('GP51_API_BASE_URL') || Deno.env.get('GP51_BASE_URL');
  const gp51GlobalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  console.log('🔍 [ENV DEBUG] Environment variables check:');
  console.log(`  - GP51_API_BASE_URL: ${Deno.env.get('GP51_API_BASE_URL') ? 'SET' : 'NOT SET'}`);
  console.log(`  - GP51_BASE_URL: ${Deno.env.get('GP51_BASE_URL') ? 'SET' : 'NOT SET'}`);
  console.log(`  - GP51_GLOBAL_API_TOKEN: ${gp51GlobalToken ? 'SET' : 'NOT SET'}`);
  console.log(`  - SUPABASE_URL: ${supabaseUrl ? 'SET' : 'NOT SET'}`);
  console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'SET' : 'NOT SET'}`);

  // Use standardized base URL with fallback
  const baseUrl = gp51BaseUrl || 'https://www.gps51.com';
  console.log(`🌐 [GP51] Using base URL: ${baseUrl}`);

  if (gp51GlobalToken) {
    console.log(`🔑 [GP51] Global API token found (length: ${gp51GlobalToken.length})`);
  }

  console.log(`🔐 [AUTH] Starting GP51 authentication for user: ${username?.substring(0, 3)}***`);

  try {
    // Check if this is an admin octopus login and we have stored credentials
    let hashedPassword = password;
    
    if (username === 'octopus') {
      console.log('🔍 [AUTH] Checking for stored admin credentials...');
      
      // Create Supabase client to check for stored credentials
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Look for stored admin session
      const { data: storedSession, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('password_hash, envio_user_id')
        .eq('username', 'octopus')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!sessionError && storedSession?.password_hash) {
        console.log('✅ [AUTH] Found stored admin credentials, using pre-hashed password');
        hashedPassword = storedSession.password_hash;
      } else {
        console.log('🔄 [AUTH] No stored credentials found, hashing provided password');
        hashedPassword = await md5_for_gp51_only(password);
      }
    } else {
      console.log('🔄 [AUTH] Regular user login, hashing password');
      hashedPassword = await md5_for_gp51_only(password);
    }

    console.log('🔄 [AUTH] Step 2: Calling GP51 authentication');
    const result = await callGP51Authentication(baseUrl, username, hashedPassword, gp51GlobalToken);
    
    if (result.success) {
      console.log('✅ [AUTH] GP51 authentication successful');
      return new Response(
        JSON.stringify(result),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.error('❌ [AUTH] GP51 authentication failed:', result.error);
      return new Response(
        JSON.stringify(result),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('❌ [AUTH] Authentication process failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function callGP51Authentication(baseUrl: string, username: string, hashedPassword: string, globalToken?: string) {
  console.log('🔄 [GP51-AUTH] Step 1: Environment validation complete');
  console.log(`🌐 [GP51-AUTH] Using API URL: ${baseUrl}`);

  try {
    console.log('🔄 [GP51-AUTH] Step 2: Using provided password hash (already hashed)');
    console.log(`🔐 Password hash: ${hashedPassword.substring(0, 8)}...`);

    console.log('🔄 [GP51-AUTH] Step 3: Preparing login request');

    // Robust URL construction - ensure /webapi is appended correctly
    let apiUrl = baseUrl;
    if (!apiUrl.endsWith('/webapi')) {
      apiUrl = apiUrl.replace(/\/$/, '') + '/webapi';
    }

    // Construct the login URL
    const loginUrl = new URL(apiUrl);
    loginUrl.searchParams.set('action', 'login');
    
    if (globalToken) {
      loginUrl.searchParams.set('token', globalToken);
    }
    
    loginUrl.searchParams.set('username', username);
    loginUrl.searchParams.set('password', hashedPassword);
    loginUrl.searchParams.set('from', 'WEB');
    loginUrl.searchParams.set('type', 'USER');

    console.log('📊 [GP51-AUTH] Login request details:');
    console.log(`  - URL: ${loginUrl.toString()}`);
    console.log(`  - Username: ${username}`);
    console.log(`  - Password hash: ${hashedPassword.substring(0, 8)}...`);
    console.log(`  - From: WEB`);
    console.log(`  - Type: USER`);
    if (globalToken) {
      console.log(`  - Token (first 10 chars): ${globalToken.substring(0, 10)}...`);
    }

    console.log('🔄 [GP51-AUTH] Step 4: Making login request to GP51');
    const response = await fetch(loginUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'EnvioFleet/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });

    console.log(`📈 [GP51-AUTH] GP51 API Response Status: ${response.status}`);
    console.log(`📈 [GP51-AUTH] Response Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);

    const responseText = await response.text();
    console.log(`📄 [GP51-AUTH] Raw Response: ${responseText}`);

    if (!response.ok) {
      throw new Error(`GP51 API Error: ${response.status} - ${responseText}`);
    }

    // Try to parse as JSON first, then fall back to text
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('📊 [GP51-AUTH] Parsed JSON Response:', responseData);
    } catch {
      console.log('📝 [GP51-AUTH] Response is not JSON, treating as plain text token: ' + responseText);
      responseData = { token: responseText.trim(), status: responseText.trim() ? 0 : 1 };
    }

    // Handle different response formats
    if (responseData.status === 0 || (responseData.token && responseData.token.length > 0)) {
      console.log('✅ [GP51-AUTH] Authentication successful');
      return {
        success: true,
        token: responseData.token || responseText.trim(),
        username: username,
        apiUrl: baseUrl
      };
    } else {
      const errorMessage = responseData.cause || responseData.message || 'Authentication failed';
      console.error('❌ [GP51-AUTH] Authentication failed:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }

  } catch (error) {
    console.error('❌ [GP51-AUTH] Request failed:', error);
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request timeout' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}
