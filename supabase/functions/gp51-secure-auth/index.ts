
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

    // Use MD5 only for GP51 API call (legacy compatibility)
    const gp51Hash = md5_for_gp51_only(password);

    const authResponse = await fetch(`${apiUrl}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username,
        password: gp51Hash,
        t: Date.now().toString()
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!authResponse.ok) {
      throw new Error(`HTTP ${authResponse.status}: ${authResponse.statusText}`);
    }

    const authResult = await authResponse.text();
    
    if (authResult.includes('error') || authResult.includes('fail')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid GP51 credentials',
          details: authResult.substring(0, 100) // Limit error details
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test token validity
    const testResponse = await fetch(`${apiUrl}/QueryMonitorList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: authResult.trim(),
        t: Date.now().toString()
      }),
      signal: AbortSignal.timeout(10000)
    });

    const testResult = await testResponse.text();
    
    if (!testResponse.ok || testResult.includes('error')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 token validation failed'
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
        username
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

    // Use MD5 only for GP51 API call (legacy compatibility)
    const gp51Hash = md5_for_gp51_only(password);

    const authResponse = await fetch(`${apiUrl}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username,
        password: gp51Hash,
        t: Date.now().toString()
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!authResponse.ok) {
      throw new Error(`HTTP ${authResponse.status}: ${authResponse.statusText}`);
    }

    const token = await authResponse.text();
    
    if (token.includes('error') || token.includes('fail')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication failed',
          details: token.substring(0, 100)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ GP51 authentication successful');
    return new Response(
      JSON.stringify({ 
        success: true,
        token: token.trim(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        apiUrl,
        username
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
