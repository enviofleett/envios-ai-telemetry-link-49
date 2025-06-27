
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { secureHash, verifySecureHash, md5_for_gp51_only, checkRateLimit } from '../_shared/crypto_utils.ts';
import { validateRequest, gp51AuthSchema } from '../_shared/validation_schemas.ts';

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
    return new Response(
      JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const validation = validateRequest(gp51AuthSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, username, password, apiUrl = 'https://www.gps51.com/webapi' } = validation.data;
    
    console.log(`🔐 GP51 Secure Auth: ${action} for user ${username}`);

    switch (action) {
      case 'test_connection':
        return await testGP51Connection(username, password, apiUrl);
      
      case 'authenticate':
        return await authenticateWithGP51(username, password, apiUrl);
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('❌ GP51 Secure Auth error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function testGP51Connection(username: string, password: string, apiUrl: string) {
  try {
    console.log(`🧪 Testing GP51 connection for ${username}...`);

    // Use async MD5 for GP51 API call (lowercase, 32 digits)
    const gp51Hash = await md5_for_gp51_only(password);

    // ✅ CORRECT: Using official GP51 API format with GET and query parameters
    const authUrl = `${apiUrl}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(gp51Hash)}&from=WEB&type=USER`;
    
    console.log('🔐 GP51 Auth URL (sanitized):', authUrl.replace(gp51Hash, '***'));

    const authResponse = await fetch(authUrl, {
      method: 'GET',  // Official GP51 API uses GET
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!authResponse.ok) {
      throw new Error(`HTTP ${authResponse.status}: ${authResponse.statusText}`);
    }

    const authResult = await authResponse.json();
    console.log('🔐 GP51 Auth Response:', { status: authResult.status, hasToken: !!authResult.token });
    
    // Check official response format (status: 0 = success)
    if (authResult.status !== 0 || !authResult.token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authResult.cause || 'Invalid GP51 credentials',
          details: 'Authentication failed - check username/password'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test device list query to verify token works
    const deviceListUrl = `${apiUrl}?action=querymonitorlist&username=${encodeURIComponent(username)}&password=${encodeURIComponent(gp51Hash)}`;
    
    console.log('📱 Testing device list query...');
    
    const testResponse = await fetch(deviceListUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });

    const testResult = await testResponse.json();
    
    if (!testResponse.ok || testResult.status !== 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 device query test failed',
          details: testResult.cause || 'Unable to fetch device list'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ GP51 connection test successful');
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'GP51 connection verified',
        apiUrl,
        username,
        deviceCount: testResult.groups?.reduce((total, group) => total + (group.devices?.length || 0), 0) || 0,
        groupCount: testResult.groups?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ GP51 connection test failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function authenticateWithGP51(username: string, password: string, apiUrl: string) {
  try {
    console.log(`🔑 Authenticating with GP51 for ${username}...`);

    // Use async MD5 for GP51 API call (lowercase, 32 digits)
    const gp51Hash = await md5_for_gp51_only(password);

    // ✅ CORRECT: Using official GP51 API format with GET and query parameters
    const authUrl = `${apiUrl}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(gp51Hash)}&from=WEB&type=USER`;

    const authResponse = await fetch(authUrl, {
      method: 'GET',  // Official GP51 API uses GET
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!authResponse.ok) {
      throw new Error(`HTTP ${authResponse.status}: ${authResponse.statusText}`);
    }

    const result = await authResponse.json();
    console.log('🔑 GP51 Auth Response:', { status: result.status, hasToken: !!result.token });
    
    // Check official response format (status: 0 = success)
    if (result.status !== 0 || !result.token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication failed',
          details: result.cause || 'Invalid credentials'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ GP51 authentication successful');
    return new Response(
      JSON.stringify({ 
        success: true,
        token: result.token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        apiUrl,
        username,
        userInfo: {
          usertype: result.usertype,
          nickname: result.nickname,
          email: result.email
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ GP51 authentication failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
