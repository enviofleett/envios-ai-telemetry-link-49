
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`🔐 [${new Date().toISOString()}] GP51 Auth Request Started`);

    if (req.method !== 'POST') {
      console.log('❌ Invalid method:', req.method);
      return new Response(
        JSON.stringify({ 
          success: false,
          status: 'error',
          error: 'Method not allowed',
          cause: `Expected POST, got ${req.method}`
        }),
        { 
          status: 405, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const body = await req.json();
    console.log('📝 Request received for user:', body.username);

    // Validate input
    if (!body.username || !body.password) {
      console.log('❌ Missing credentials');
      return new Response(
        JSON.stringify({ 
          success: false,
          status: 'error',
          error: 'Username and password required',
          cause: 'Missing credentials in request body'
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Get GP51 API configuration from environment
    const gp51ApiUrl = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com/webapi';
    const gp51GlobalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    
    console.log('🔧 Config check:', {
      hasApiUrl: !!gp51ApiUrl,
      hasGlobalToken: !!gp51GlobalToken,
      apiUrl: gp51ApiUrl
    });

    // For GP51, we typically need to authenticate using their Login endpoint
    console.log('🔐 Attempting GP51 authentication...');
    
    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/plain',
      'User-Agent': 'Envio-Fleet-GP51-Integration/1.0'
    };

    // GP51 uses form-encoded authentication
    const authBody = new URLSearchParams({
      username: body.username,
      password: body.password,
      t: Date.now().toString()
    });

    const gp51Response = await fetch(`${gp51ApiUrl}/Login`, {
      method: 'POST',
      headers: authHeaders,
      body: authBody.toString()
    });

    console.log('📡 GP51 API response:', {
      status: gp51Response.status,
      statusText: gp51Response.statusText,
      ok: gp51Response.ok
    });

    if (!gp51Response.ok) {
      const errorText = await gp51Response.text();
      console.error('❌ GP51 API error:', {
        status: gp51Response.status,
        error: errorText
      });
      
      return new Response(
        JSON.stringify({ 
          success: false,
          status: 'error',
          error: 'GP51 authentication failed',
          cause: `GP51 API returned ${gp51Response.status}: ${errorText}`,
          details: {
            apiStatus: gp51Response.status,
            apiResponse: errorText.substring(0, 200) // Limit response size
          }
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const tokenResponse = await gp51Response.text();
    console.log('📝 GP51 token response length:', tokenResponse.length);

    // Check if response contains error
    if (tokenResponse.includes('error') || tokenResponse.includes('fail') || tokenResponse.length < 10) {
      console.error('❌ GP51 authentication failed:', tokenResponse);
      return new Response(
        JSON.stringify({ 
          success: false,
          status: 'error',
          error: 'Invalid GP51 credentials',
          cause: 'GP51 returned error or invalid token',
          details: {
            response: tokenResponse.substring(0, 100)
          }
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Test the token by making a quick API call
    const testResponse = await fetch(`${gp51ApiUrl}/QueryMonitorList`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        token: tokenResponse.trim(),
        t: Date.now().toString()
      }).toString()
    });

    if (!testResponse.ok) {
      console.log('⚠️ Token test failed, but continuing...');
    }

    console.log('✅ GP51 authentication successful');

    return new Response(
      JSON.stringify({ 
        success: true,
        status: 'authenticated',
        token: tokenResponse.trim(),
        username: body.username,
        expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString() // 24 hours
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('💥 Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        status: 'error',
        error: 'Internal server error',
        cause: error.message,
        details: {
          errorType: error.constructor.name,
          message: error.message
        }
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});
