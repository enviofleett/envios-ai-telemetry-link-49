
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_for_gp51_only, checkRateLimit, sanitizeInput, isValidUsername } from "../_shared/crypto_utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Rate limiting
  if (!checkRateLimit(clientIP, 5, 15 * 60 * 1000)) {
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
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, username, password } = body;

    if (action === 'authenticate') {
      return await authenticateWithGP51(username, password, supabase);
    }

    return new Response(JSON.stringify({
      success: false,
      error: `Unknown action: ${action}`
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ GP51 Hybrid Auth error:', error);
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
  console.log(`🔐 Starting GP51 authentication for user: ${trimmedUsername}`);
  
  if (!isValidUsername(trimmedUsername)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid username format'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('🔄 Attempting GP51 login for user:', trimmedUsername);
    
    // Use async MD5 for GP51 API compatibility
    const gp51Hash = await md5_for_gp51_only(password);
    
    // Try GP51 authentication with form data approach
    const authResponse = await fetch('https://www.gps51.com/webapi/Login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/plain',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: new URLSearchParams({
        username: trimmedUsername,
        password: gp51Hash,
        t: Date.now().toString()
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!authResponse.ok) {
      throw new Error(`HTTP ${authResponse.status}: ${authResponse.statusText}`);
    }

    const authResult = await authResponse.text();
    console.log('📊 GP51 Response:', authResult.substring(0, 100));
    
    if (authResult.includes('error') || authResult.includes('fail') || authResult.length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid GP51 credentials'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authResult.trim();
    console.log('✅ GP51 authentication successful');

    // Create or update user in our system
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
      console.warn('Failed to create/update user:', userError);
    }

    // Store GP51 session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const { error: sessionError } = await supabase
      .from('gp51_sessions')
      .upsert({
        username: trimmedUsername,
        gp51_token: token,
        token_expires_at: expiresAt.toISOString(),
        last_validated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'username'
      });

    if (sessionError) {
      console.warn('Failed to store GP51 session:', sessionError);
    }

    return new Response(JSON.stringify({
      success: true,
      token,
      username: trimmedUsername,
      expiresAt: expiresAt.toISOString(),
      user,
      session: { token, expiresAt }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ GP51 authentication failed:', error);
    
    if (error.name === 'AbortError') {
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
      error: error instanceof Error ? error.message : 'Authentication failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
