
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getGP51ApiUrl, buildGP51ApiUrl, isValidGP51BaseUrl, sanitizeGP51Params } from '../_shared/constants.ts';
import { md5_sync, sanitizeInput, checkRateLimit } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51AuthRequest {
  username: string;
  password: string;
  apiUrl?: string;
}

interface GP51QueryRequest {
  action: string;
  token: string;
  params?: Record<string, any>;
  apiUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { action } = body;

    console.log(`🔍 [GP51-SERVICE] Processing action: ${action}`);

    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`gp51-service:${clientIp}`, 60, 60000)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'authenticate':
        return await handleAuthentication(supabase, body as GP51AuthRequest);
      
      case 'querymonitorlist':
      case 'lastposition':
      case 'querytracks':
      case 'querytrips':
        return await handleGP51Query(supabase, body as GP51QueryRequest);
      
      case 'test_connection':
        return await handleConnectionTest(supabase);
      
      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown action: ${action}` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('❌ [GP51-SERVICE] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleAuthentication(supabase: any, request: GP51AuthRequest) {
  const { username, password, apiUrl = 'https://www.gps51.com' } = request;

  // Validate inputs
  const usernameValidation = sanitizeInput(username, 'username');
  const passwordValidation = sanitizeInput(password, 'password');

  if (!usernameValidation.isValid) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: usernameValidation.error 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!passwordValidation.isValid) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: passwordValidation.error 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!isValidGP51BaseUrl(apiUrl)) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Invalid GP51 API URL' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log(`🔐 [GP51-SERVICE] Authenticating user: ${usernameValidation.sanitized}`);

    // Hash password using MD5 (GP51 requirement)
    const hashedPassword = md5_sync(passwordValidation.sanitized);
    console.log(`🔑 [GP51-SERVICE] Password hashed: ${hashedPassword.substring(0, 8)}...`);

    // Build GP51 authentication URL
    const authUrl = buildGP51ApiUrl(apiUrl, 'login', {
      username: usernameValidation.sanitized,
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    });

    console.log(`🌐 [GP51-SERVICE] Calling GP51 API: ${authUrl.split('?')[0]}`);

    // Call GP51 API
    const response = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Envio-Fleet-Management/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`GP51 API returned ${response.status}: ${response.statusText}`);
    }

    const gp51Result = await response.json();
    console.log(`📊 [GP51-SERVICE] GP51 response status: ${gp51Result.status}`);

    if (gp51Result.status === 0) {
      // Authentication successful
      console.log(`✅ [GP51-SERVICE] Authentication successful for user: ${gp51Result.username}`);

      // Store session in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 23); // GP51 tokens last 24 hours

        const { error: sessionError } = await supabase.rpc('upsert_gp51_session', {
          p_envio_user_id: user.id,
          p_username: gp51Result.username,
          p_password_hash: hashedPassword,
          p_gp51_token: gp51Result.token,
          p_api_url: apiUrl,
          p_token_expires_at: expiresAt.toISOString()
        });

        if (sessionError) {
          console.error('❌ [GP51-SERVICE] Failed to store session:', sessionError);
        } else {
          console.log('💾 [GP51-SERVICE] Session stored successfully');
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          username: gp51Result.username,
          token: gp51Result.token,
          userType: gp51Result.usertype,
          apiUrl: apiUrl
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Authentication failed
      console.log(`❌ [GP51-SERVICE] Authentication failed: ${gp51Result.cause}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: gp51Result.cause || 'Authentication failed'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ [GP51-SERVICE] Authentication error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleGP51Query(supabase: any, request: GP51QueryRequest) {
  const { action, token, params = {}, apiUrl = 'https://www.gps51.com' } = request;

  if (!token) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Token is required' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log(`🔍 [GP51-SERVICE] Executing query: ${action}`);

    // Sanitize parameters
    const sanitizedParams = sanitizeGP51Params(params);

    // Build query URL
    const queryUrl = buildGP51ApiUrl(apiUrl, action, {
      token,
      ...sanitizedParams
    });

    console.log(`🌐 [GP51-SERVICE] Calling GP51 API: ${queryUrl.split('?')[0]}`);

    // Call GP51 API
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Envio-Fleet-Management/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`GP51 API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`📊 [GP51-SERVICE] Query ${action} completed with status: ${result.status}`);

    return new Response(
      JSON.stringify({
        success: result.status === 0,
        data: result,
        error: result.status !== 0 ? result.cause : null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ [GP51-SERVICE] Query ${action} error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Query failed'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleConnectionTest(supabase: any) {
  try {
    console.log('🧪 [GP51-SERVICE] Testing connection...');

    // Get active session from database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not authenticated' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('envio_user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No active GP51 session found' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session is expired
    if (new Date(session.token_expires_at) <= new Date()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 session expired' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test connection with querymonitorlist
    const testUrl = buildGP51ApiUrl(session.api_url, 'querymonitorlist', {
      token: session.gp51_token
    });

    const response = await fetch(testUrl);
    const result = await response.json();

    console.log(`✅ [GP51-SERVICE] Connection test completed with status: ${result.status}`);

    return new Response(
      JSON.stringify({
        success: result.status === 0,
        username: session.username,
        apiUrl: session.api_url,
        error: result.status !== 0 ? result.cause : null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [GP51-SERVICE] Connection test error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
