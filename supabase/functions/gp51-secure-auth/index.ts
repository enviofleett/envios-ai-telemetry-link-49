
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { md5_for_gp51_only } from '../_shared/crypto_utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Add comprehensive logging from the start
  console.log(`[${new Date().toISOString()}] 🚀 GP51 Secure Auth Request - Method: ${req.method}`);

  if (req.method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] ✅ CORS preflight handled`);
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`[${new Date().toISOString()}] 🔧 Environment check starting...`);

    // Environment validation with detailed logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    console.log(`[${new Date().toISOString()}] 📊 Environment status:`, {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey
    });

    // Initialize Supabase client with service role for secure operations
    const supabaseAdmin = createClient(
      supabaseUrl ?? '',
      supabaseServiceKey ?? ''
    );

    // Get authenticated user from request
    const authHeader = req.headers.get('Authorization');
    console.log(`[${new Date().toISOString()}] 🔐 Auth header present: ${!!authHeader}`);
    
    if (!authHeader) {
      console.error(`[${new Date().toISOString()}] ❌ Missing authorization header`);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Authorization header required',
        debug: 'No Authorization header provided in request'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    console.log(`[${new Date().toISOString()}] 🔍 Verifying user authentication...`);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error(`[${new Date().toISOString()}] ❌ Auth verification error:`, authError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid authentication',
        debug: authError.message
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!user) {
      console.error(`[${new Date().toISOString()}] ❌ No user found in session`);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'User not authenticated',
        debug: 'No user found in session'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${new Date().toISOString()}] ✅ User authenticated: ${user.email}`);

    // Parse and validate request body
    console.log(`[${new Date().toISOString()}] 📖 Parsing request body...`);
    let body;
    try {
      const rawBody = await req.text();
      console.log(`[${new Date().toISOString()}] 📄 Raw body length: ${rawBody.length}`);
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error(`[${new Date().toISOString()}] ❌ JSON parse error:`, parseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid JSON in request body',
        debug: parseError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { username, password, apiUrl = 'https://www.gps51.com/webapi' } = body;
    console.log(`[${new Date().toISOString()}] 📋 Request params:`, {
      hasUsername: !!username,
      hasPassword: !!password,
      apiUrl
    });

    // Validate inputs
    if (!username || !password) {
      console.error(`[${new Date().toISOString()}] ❌ Missing credentials`);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Username and password required',
        debug: `Missing - Username: ${!username}, Password: ${!password}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${new Date().toISOString()}] 🔐 GP51 authentication for user: ${username}`);

    // Hash password using the working MD5 implementation
    console.log(`[${new Date().toISOString()}] 🔐 Generating MD5 hash...`);
    const hashedPassword = await md5_for_gp51_only(password);
    console.log(`[${new Date().toISOString()}] ✅ MD5 hash generated successfully`);

    // Build GP51 API URL
    const gp51Url = new URL(apiUrl);
    gp51Url.searchParams.set('action', 'login');
    gp51Url.searchParams.set('username', username);
    gp51Url.searchParams.set('password', hashedPassword);
    gp51Url.searchParams.set('from', 'WEB');
    gp51Url.searchParams.set('type', 'USER');

    console.log(`[${new Date().toISOString()}] 📡 Calling GP51 API: ${gp51Url.toString().replace(hashedPassword, '[REDACTED]')}`);

    // Call GP51 API with timeout and error handling
    let gp51Response;
    try {
      gp51Response = await fetch(gp51Url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Supabase-GP51-Integration/1.0'
        },
        signal: AbortSignal.timeout(15000)
      });
    } catch (fetchError) {
      console.error(`[${new Date().toISOString()}] ❌ GP51 API fetch error:`, fetchError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to connect to GP51 API',
        debug: fetchError.message
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${new Date().toISOString()}] 📡 GP51 Response status: ${gp51Response.status}`);

    if (!gp51Response.ok) {
      console.error(`[${new Date().toISOString()}] ❌ GP51 API Error: ${gp51Response.status}`);
      return new Response(JSON.stringify({
        success: false,
        error: `GP51 API Error: ${gp51Response.status}`,
        debug: `HTTP ${gp51Response.status} ${gp51Response.statusText}`
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const responseText = await gp51Response.text();
    console.log(`[${new Date().toISOString()}] 📄 GP51 Response length: ${responseText.length}`);

    let gp51Result;
    try {
      gp51Result = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[${new Date().toISOString()}] ❌ GP51 JSON Parse Error:`, parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid response from GP51',
        debug: `JSON parse error: ${parseError.message}. Response: ${responseText.substring(0, 100)}`
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${new Date().toISOString()}] 🔐 GP51 Result status: ${gp51Result.status}`);

    if (gp51Result.status === 0 && gp51Result.token) {
      // Success - store session in database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 23); // GP51 tokens typically last 24 hours

      console.log(`[${new Date().toISOString()}] 💾 Storing GP51 session in database...`);

      // Use the secure function to store session
      const { data: sessionId, error: sessionError } = await supabaseAdmin
        .rpc('upsert_gp51_session', {
          p_user_id: user.id,
          p_username: username,
          p_gp51_token: gp51Result.token,
          p_expires_at: expiresAt.toISOString(),
          p_session_fingerprint: req.headers.get('user-agent')?.substring(0, 255)
        });

      if (sessionError) {
        console.error(`[${new Date().toISOString()}] ❌ Session storage error:`, sessionError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to store GP51 session',
          debug: sessionError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[${new Date().toISOString()}] ✅ GP51 authentication successful, session stored: ${sessionId}`);

      return new Response(JSON.stringify({
        success: true,
        token: gp51Result.token,
        username: username,
        sessionId: sessionId,
        expiresAt: expiresAt.toISOString(),
        loginTime: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      console.error(`[${new Date().toISOString()}] ❌ GP51 authentication failed:`, gp51Result.cause);
      return new Response(JSON.stringify({
        success: false,
        error: gp51Result.cause || 'GP51 authentication failed',
        gp51_status: gp51Result.status,
        debug: `GP51 returned status ${gp51Result.status}: ${gp51Result.cause}`
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] 💥 GP51 Auth Error:`, error);
    console.error(`[${new Date().toISOString()}] 📍 Stack trace:`, error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Authentication failed: ${error.message}`,
      debug: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
