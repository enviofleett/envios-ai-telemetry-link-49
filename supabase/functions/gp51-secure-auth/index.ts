
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Proper MD5 implementation for GP51 compatibility
async function md5Hash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`[${new Date().toISOString()}] GP51 Secure Auth Request`);

    // Initialize Supabase client with service role for secure operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Authorization header required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid authentication'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { username, password, apiUrl = 'https://www.gps51.com/webapi' } = body;

    // Validate inputs
    if (!username || !password) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Username and password required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔐 GP51 authentication for user:', username);

    // Hash password for GP51 API
    const hashedPassword = await md5Hash(password);

    // Build GP51 API URL
    const gp51Url = new URL(apiUrl);
    gp51Url.searchParams.set('action', 'login');
    gp51Url.searchParams.set('username', username);
    gp51Url.searchParams.set('password', hashedPassword);
    gp51Url.searchParams.set('from', 'WEB');
    gp51Url.searchParams.set('type', 'USER');

    console.log('📡 Calling GP51 API...');

    // Call GP51 API
    const gp51Response = await fetch(gp51Url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Supabase-GP51-Integration/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!gp51Response.ok) {
      throw new Error(`GP51 API Error: ${gp51Response.status}`);
    }

    const responseText = await gp51Response.text();
    console.log('📄 GP51 Response length:', responseText.length);

    let gp51Result;
    try {
      gp51Result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }

    console.log('🔐 GP51 Result status:', gp51Result.status);

    if (gp51Result.status === 0 && gp51Result.token) {
      // Success - store session in database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 23); // GP51 tokens typically last 24 hours

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
        console.error('❌ Session storage error:', sessionError);
        throw new Error('Failed to store GP51 session');
      }

      console.log('✅ GP51 authentication successful, session stored:', sessionId);

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
      console.error('❌ GP51 authentication failed:', gp51Result.cause);
      return new Response(JSON.stringify({
        success: false,
        error: gp51Result.cause || 'GP51 authentication failed',
        gp51_status: gp51Result.status
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('💥 GP51 Auth Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Authentication failed: ${error.message}`,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
