
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_for_gp51_only, checkRateLimit, sanitizeInput } from '../_shared/crypto_utils.ts';

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
  if (!checkRateLimit(clientIP, 10, 15 * 60 * 1000)) {
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

    console.log('🔍 Checking GP51 connection status...');

    // Get the most recent GP51 session
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('last_validated_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error('Error fetching GP51 sessions:', sessionError);
      return new Response(JSON.stringify({
        success: false,
        connected: false,
        error: 'Failed to check GP51 connection'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!sessions || sessions.length === 0) {
      console.log('No GP51 sessions found');
      return new Response(JSON.stringify({
        success: true,
        connected: false,
        message: 'No GP51 connection found'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const session = sessions[0];
    const tokenExpiry = new Date(session.token_expires_at);
    const now = new Date();

    if (tokenExpiry <= now) {
      console.log('GP51 token has expired');
      return new Response(JSON.stringify({
        success: true,
        connected: false,
        message: 'GP51 token has expired',
        lastConnection: session.last_validated_at,
        username: session.username
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test the token with GP51 API
    try {
      const testUrl = `https://www.gps51.com/webapi?action=getuserinfo&token=${encodeURIComponent(session.gp51_token)}`;
      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0/ConnectionCheck'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (testResponse.ok) {
        const testResult = await testResponse.json();
        if (testResult.status === 0) {
          console.log('✅ GP51 connection is active and valid');
          
          // Update last validated time
          await supabase
            .from('gp51_sessions')
            .update({ last_validated_at: new Date().toISOString() })
            .eq('id', session.id);

          return new Response(JSON.stringify({
            success: true,
            connected: true,
            username: session.username,
            lastValidated: new Date().toISOString(),
            tokenExpiry: session.token_expires_at,
            authMethod: session.auth_method
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      console.log('GP51 token test failed, connection may be inactive');
      return new Response(JSON.stringify({
        success: true,
        connected: false,
        message: 'GP51 token test failed',
        username: session.username,
        lastConnection: session.last_validated_at
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (testError) {
      console.error('Error testing GP51 token:', testError);
      return new Response(JSON.stringify({
        success: true,
        connected: false,
        message: 'GP51 connection test failed',
        username: session.username,
        error: testError.name === 'AbortError' ? 'Connection timeout' : 'Connection test failed'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('GP51 connection check error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error during connection check'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
