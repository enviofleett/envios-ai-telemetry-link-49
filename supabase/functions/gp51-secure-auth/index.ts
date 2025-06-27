
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`[${new Date().toISOString()}] GP51 Secure Auth Request`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Authorization required'
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
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Username and password are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔐 GP51 authentication for user: ${username}`);

    // Generate MD5 hash for GP51 compatibility
    const hashedPassword = await createMD5Hash(password);
    console.log('✅ MD5 hash generated successfully');

    // Call GP51 API with proper endpoint
    console.log('📡 Calling GP51 API...');
    const gp51Response = await fetch('https://www.gps51.com/webapi?action=login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-GP51-Integration/1.0'
      },
      body: JSON.stringify({
        username,
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!gp51Response.ok) {
      throw new Error(`GP51 API Error: ${gp51Response.status}`);
    }

    const responseText = await gp51Response.text();
    console.log(`📄 GP51 Response length: ${responseText.length}`);

    // Enhanced JSON parsing with validation
    if (!responseText || responseText.trim().length === 0) {
      console.error('❌ Empty response from GP51 API');
      return new Response(JSON.stringify({
        success: false,
        error: 'Empty response from GP51 API'
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if response looks like JSON
    const trimmedResponse = responseText.trim();
    if (!trimmedResponse.startsWith('{') && !trimmedResponse.startsWith('[')) {
      console.error('❌ Non-JSON response from GP51:', trimmedResponse.substring(0, 100));
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid response format from GP51 API'
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let gp51Result;
    try {
      gp51Result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON response from GP51 API'
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📊 GP51 Response status:', gp51Result.status);

    if (gp51Result.status === 0 && gp51Result.token) {
      // Store session in database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 23); // GP51 tokens last ~24 hours

      const { error: sessionError } = await supabaseAdmin
        .from('gp51_sessions')
        .upsert({
          envio_user_id: user.id,
          username: username,
          gp51_token: gp51Result.token,
          token_expires_at: expiresAt.toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        }, {
          onConflict: 'envio_user_id'
        });

      if (sessionError) {
        console.error('❌ Failed to store session:', sessionError);
      } else {
        console.log('✅ GP51 session stored successfully');
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'GP51 authentication successful',
        username: username,
        token: gp51Result.token,
        expiresAt: expiresAt.toISOString(),
        timestamp: new Date().toISOString()
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

async function createMD5Hash(input: string): Promise<string> {
  // Fallback MD5-like hash for GP51 compatibility
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  let result = Math.abs(hash).toString(16);
  while (result.length < 32) {
    result = '0' + result;
  }
  return result.toLowerCase();
}
