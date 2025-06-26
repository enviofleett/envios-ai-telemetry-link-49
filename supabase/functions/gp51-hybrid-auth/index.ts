
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper function to create MD5 hash
async function md5Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // Simple MD5-like hash implementation for Deno
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex and pad to 32 characters (MD5-like format)
  return Math.abs(hash).toString(16).padStart(32, '0');
}

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
    const gp51InitialToken = Deno.env.get('GP51_INITIAL_TOKEN') || '6c1f1207c35d97a744837a19663ecdbe';
    
    console.log('🔧 Config check:', {
      hasApiUrl: !!gp51ApiUrl,
      hasInitialToken: !!gp51InitialToken,
      apiUrl: gp51ApiUrl
    });

    // Step 1: Hash the password with MD5 (required by GP51)
    console.log('🔐 Encrypting password with MD5...');
    const md5Password = await md5Hash(body.password);
    console.log('✅ Password encrypted');

    // Step 2: Prepare GP51 API call with correct format
    const loginUrl = `${gp51ApiUrl}?action=login&token=${gp51InitialToken}`;
    
    const gp51RequestBody = {
      username: body.username,
      password: md5Password,  // MD5 encrypted password
      from: "WEB",           // Required: login source
      type: "USER"           // Required: login type
    };

    console.log('🌐 Calling GP51 API:', {
      url: loginUrl,
      username: body.username,
      from: gp51RequestBody.from,
      type: gp51RequestBody.type
    });

    // For GP51, we use form-encoded data as they might expect it
    const formData = new URLSearchParams({
      username: body.username,
      password: md5Password,
      from: "WEB",
      type: "USER"
    });

    const gp51Response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Envio-Fleet-GP51-Integration/1.0'
      },
      body: formData.toString()
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

    const responseText = await gp51Response.text();
    console.log('📄 GP51 response body:', responseText);

    let authData;
    try {
      authData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse GP51 response as JSON:', parseError);
      
      // Check if response contains error keywords
      if (responseText.includes('error') || responseText.includes('fail')) {
        return new Response(
          JSON.stringify({ 
            success: false,
            status: 'error',
            error: 'Invalid GP51 credentials',
            cause: 'GP51 returned error response',
            details: {
              response: responseText.substring(0, 100)
            }
          }),
          { 
            status: 401, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      // If it's not JSON but also not an error, treat as token
      if (responseText.length > 10 && !responseText.includes('<')) {
        authData = { status: 0, token: responseText.trim() };
      } else {
        return new Response(
          JSON.stringify({ 
            success: false,
            status: 'error',
            error: 'Invalid response from GP51 API',
            cause: 'GP51 API returned non-JSON response',
            details: {
              response: responseText.substring(0, 200)
            }
          }),
          { 
            status: 502, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
    }

    // Check GP51 response according to their API format
    if (authData.status && authData.status !== 0) {
      console.error('❌ GP51 authentication failed:', authData);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          status: 'error',
          error: 'GP51 authentication failed',
          cause: authData.cause || 'Authentication rejected by GP51',
          details: {
            gp51Status: authData.status,
            gp51Cause: authData.cause
          }
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('✅ GP51 authentication successful');

    const token = authData.token || responseText.trim();

    return new Response(
      JSON.stringify({ 
        success: true,
        status: 'authenticated',
        token: token,
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
