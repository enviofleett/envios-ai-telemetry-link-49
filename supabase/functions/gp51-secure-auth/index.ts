
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// MD5 hash function for Deno
async function md5Hash(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
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

    const body = await req.json();
    const { username, password, apiUrl = 'https://www.gps51.com/webapi' } = body;
    
    // Input validation
    if (!username || !password) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Username and password required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Sanitize inputs
    const cleanUsername = username.toString().trim();
    const cleanPassword = password.toString();

    if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Username must be between 3 and 50 characters'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Hash password using MD5 as required by GP51
    const gp51Hash = await md5Hash(cleanPassword);
    
    console.log('🔐 Attempting GP51 authentication for user:', cleanUsername);

    // Build the correct GP51 API URL with query parameters
    const authUrl = new URL(apiUrl);
    authUrl.searchParams.set('action', 'login');
    authUrl.searchParams.set('username', cleanUsername);
    authUrl.searchParams.set('password', gp51Hash);
    authUrl.searchParams.set('from', 'WEB');
    authUrl.searchParams.set('type', 'USER');

    console.log('📡 GP51 Auth URL (sanitized):', authUrl.toString().replace(gp51Hash, '***'));

    // Make GET request to GP51 API (as per official documentation)
    const gp51Response = await fetch(authUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnviosFleet/1.0'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    console.log('📡 GP51 Response Status:', gp51Response.status);

    if (!gp51Response.ok) {
      throw new Error(`GP51 API Error: ${gp51Response.status} ${gp51Response.statusText}`);
    }

    const responseText = await gp51Response.text();
    console.log('📄 Response Length:', responseText.length);

    if (!responseText) {
      throw new Error('Empty response from GP51');
    }

    let authResult;
    try {
      authResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }

    console.log('🔐 GP51 Auth Result:', {
      status: authResult.status,
      cause: authResult.cause,
      hasToken: !!authResult.token
    });

    // Check GP51 response format (status: 0 = success)
    if (authResult.status === 0 && authResult.token) {
      console.log('✅ GP51 authentication successful');
      
      return new Response(
        JSON.stringify({ 
          success: true,
          token: authResult.token,
          username: cleanUsername,
          apiUrl,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          loginTime: new Date().toISOString()
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } else {
      console.error('❌ GP51 authentication failed:', authResult.cause);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: authResult.cause || 'Authentication failed',
          status: authResult.status
        }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

  } catch (error) {
    console.error('💥 GP51 Auth Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Authentication failed: ${error.message}`,
        details: error.stack
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
