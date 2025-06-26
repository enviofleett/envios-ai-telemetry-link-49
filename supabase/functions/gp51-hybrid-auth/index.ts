
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Import crypto for MD5 hashing
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper function to create MD5 hash
async function md5Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`🔐 [${new Date().toISOString()}] GP51 Auth Request Started`);

    if (req.method !== 'POST') {
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

    // Get GP51 configuration
    const apiUrl = Deno.env.get('GP51_API_URL') || 'https://www.gps51.com/webapi';
    const initialToken = Deno.env.get('GP51_INITIAL_TOKEN') || '6c1f1207c35d97a744837a19663ecdbe';
    
    console.log('🔧 Config check:', {
      hasApiUrl: !!apiUrl,
      hasInitialToken: !!initialToken,
      apiUrl: apiUrl
    });

    // Hash the password with MD5 (required by GP51)
    console.log('🔐 Encrypting password with MD5...');
    const md5Password = await md5Hash(body.password);
    console.log('✅ Password encrypted');

    // Prepare GP51 API call with correct format
    const loginUrl = `${apiUrl}?action=login&token=${initialToken}`;
    
    const gp51RequestBody = {
      username: body.username,
      password: md5Password,
      from: "WEB",
      type: "USER"
    };

    console.log('🌐 Calling GP51 API:', {
      url: loginUrl,
      username: body.username,
      from: gp51RequestBody.from,
      type: gp51RequestBody.type
    });

    // Call GP51 API
    const gp51Response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Envio-Fleet-GP51-Integration/1.0'
      },
      body: JSON.stringify(gp51RequestBody)
    });

    console.log('📡 GP51 API response:', {
      status: gp51Response.status,
      statusText: gp51Response.statusText,
      ok: gp51Response.ok
    });

    // Get response text
    const responseText = await gp51Response.text();
    console.log('📄 GP51 response body:', responseText);

    // Handle empty response (common with GP51 on success)
    if (!responseText || responseText.trim().length === 0) {
      console.log('⚠️ Empty response from GP51');
      
      if (gp51Response.ok) {
        console.log('✅ Treating empty 200 response as authentication success');
        return new Response(
          JSON.stringify({ 
            success: true,
            status: 'authenticated',
            token: initialToken,
            username: body.username,
            expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString()
          }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            success: false,
            status: 'error',
            error: 'GP51 authentication failed',
            cause: `HTTP ${gp51Response.status}: Empty response`,
            details: {
              httpStatus: gp51Response.status,
              statusText: gp51Response.statusText
            }
          }),
          { 
            status: 401, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
    }

    // Try to parse JSON response
    let authData;
    try {
      authData = JSON.parse(responseText);
      console.log('✅ Successfully parsed JSON response:', authData);
    } catch (parseError) {
      console.error('❌ Failed to parse GP51 response as JSON:', parseError);
      
      // Check if it's HTML error page
      if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
        return new Response(
          JSON.stringify({ 
            success: false,
            status: 'error',
            error: 'GP51 API returned HTML error page',
            cause: 'Possible server error or incorrect endpoint',
            details: {
              httpStatus: gp51Response.status,
              responsePreview: responseText.substring(0, 200)
            }
          }),
          { 
            status: 502, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      // Check for plain text success indicators
      const lowerResponse = responseText.toLowerCase();
      if (lowerResponse.includes('ok') || lowerResponse.includes('success') || lowerResponse.includes('authenticated')) {
        console.log('✅ Treating text response as success');
        return new Response(
          JSON.stringify({ 
            success: true,
            status: 'authenticated',
            token: initialToken,
            username: body.username,
            expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString()
          }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      // If we can't parse and it's not a success indicator, it's an error
      return new Response(
        JSON.stringify({ 
          success: false,
          status: 'error',
          error: 'Invalid response format from GP51',
          cause: 'Cannot parse GP51 response',
          details: {
            parseError: parseError.message,
            httpStatus: gp51Response.status,
            responsePreview: responseText.substring(0, 300)
          }
        }),
        { 
          status: 502, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Handle JSON response according to GP51 API specification
    if (authData && typeof authData === 'object') {
      // GP51 uses status: 0 for success, 1 for failure
      if (authData.status === 0 || authData.cause === 'OK') {
        console.log('✅ GP51 authentication successful via JSON response');
        
        return new Response(
          JSON.stringify({ 
            success: true,
            status: 'authenticated',
            token: authData.token || initialToken,
            username: body.username,
            expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString()
          }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      } else {
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
    }

    // Fallback for unexpected response format
    console.log('⚠️ Unexpected response format, defaulting to error');
    return new Response(
      JSON.stringify({ 
        success: false,
        status: 'error',
        error: 'Unexpected response format from GP51',
        cause: 'Response format not recognized',
        details: {
          httpStatus: gp51Response.status,
          responseType: typeof authData,
          responseContent: authData
        }
      }),
      { 
        status: 502, 
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
          errorType: error.constructor.name
        }
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});
