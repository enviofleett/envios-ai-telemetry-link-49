
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
    console.log('🧪 GP51 Connection Test Function Started');

    // Test environment variables
    const envCheck = {
      SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
      SUPABASE_ANON_KEY: !!Deno.env.get('SUPABASE_ANON_KEY'),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    };

    console.log('🔧 Environment check:', envCheck);

    // Test auth header
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Auth header present:', !!authHeader);

    // Test request body parsing
    let body = {};
    try {
      const rawBody = await req.text();
      if (rawBody) {
        body = JSON.parse(rawBody);
      }
    } catch (e) {
      console.log('📖 Body parse error (not critical for test):', e.message);
    }

    // Test Supabase client creation
    let userInfo = null;
    if (authHeader && envCheck.SUPABASE_URL && envCheck.SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error } = await supabase.auth.getUser();
        userInfo = { 
          hasUser: !!user, 
          userEmail: user?.email,
          authError: error?.message 
        };
      } catch (e) {
        userInfo = { error: e.message };
      }
    }

    // Test GP51 API connectivity (without credentials)
    let gp51Test = null;
    try {
      const testResponse = await fetch('https://www.gps51.com/webapi', {
        method: 'GET',
        headers: { 'User-Agent': 'Test-Client/1.0' },
        signal: AbortSignal.timeout(5000)
      });
      gp51Test = {
        accessible: true,
        status: testResponse.status,
        statusText: testResponse.statusText
      };
    } catch (e) {
      gp51Test = {
        accessible: false,
        error: e.message
      };
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'GP51 Connection Test Results',
      timestamp: new Date().toISOString(),
      results: {
        environment: envCheck,
        authentication: userInfo,
        gp51Connectivity: gp51Test,
        requestInfo: {
          method: req.method,
          hasAuthHeader: !!authHeader,
          bodyReceived: Object.keys(body).length > 0
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Test function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
