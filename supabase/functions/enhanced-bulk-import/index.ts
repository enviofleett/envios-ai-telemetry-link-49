
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_for_gp51_only, checkRateLimit } from '../_shared/crypto_utils.ts';
import { authStrategies, type GP51AuthResult } from './gp51-auth-strategies.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  action: string;
  username?: string;
  password?: string;
}

async function authenticateWithGP51(username: string, password: string): Promise<GP51AuthResult> {
  console.log(`🔐 [GP51-AUTH] Starting multi-strategy authentication for: ${username}`);
  
  try {
    // Generate MD5 hash for GP51 compatibility
    const hashedPassword = await md5_for_gp51_only(password);
    console.log(`🔐 [GP51-AUTH] Password hashed successfully: ${hashedPassword.substring(0, 8)}...`);
    
    const baseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
    const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    
    console.log(`🌐 [GP51-AUTH] Base URL: ${baseUrl}`);
    console.log(`🔑 [GP51-AUTH] Global token: ${globalToken ? 'SET (length: ' + globalToken.length + ')' : 'NOT SET'}`);
    
    // Try each authentication strategy
    for (const strategy of authStrategies) {
      console.log(`🎯 [GP51-AUTH] Trying strategy: ${strategy.name}`);
      
      try {
        const result = await strategy.execute(username, hashedPassword, baseUrl, globalToken);
        
        if (result.success) {
          console.log(`✅ [GP51-AUTH] Authentication successful using ${strategy.name}`);
          return result;
        } else {
          console.warn(`⚠️ [GP51-AUTH] Strategy ${strategy.name} failed: ${result.error}`);
          // Continue to next strategy
        }
      } catch (strategyError) {
        console.error(`❌ [GP51-AUTH] Strategy ${strategy.name} threw error:`, strategyError);
        // Continue to next strategy
      }
    }
    
    // All strategies failed
    console.error(`❌ [GP51-AUTH] All authentication strategies failed`);
    return {
      success: false,
      error: 'All authentication strategies failed. GP51 API may be unreachable or credentials invalid.',
      details: { strategiesTried: authStrategies.map(s => s.name) }
    };
    
  } catch (error) {
    console.error(`❌ [GP51-AUTH] Authentication error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown authentication error',
      details: { error: String(error) }
    };
  }
}

async function testGP51Connection(username: string, password: string): Promise<Response> {
  console.log(`🧪 [TEST-CONNECTION] Testing GP51 connectivity for user: ${username}`);
  
  const authResult = await authenticateWithGP51(username, password);
  
  if (!authResult.success) {
    console.error(`❌ [TEST-CONNECTION] Authentication failed:`, authResult.error);
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error,
      details: authResult.details,
      diagnostics: {
        strategiesTried: authResult.details?.strategiesTried || [],
        timestamp: new Date().toISOString()
      }
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  console.log(`✅ [TEST-CONNECTION] Authentication successful using method: ${authResult.method}`);
  
  // Verify token works by testing a simple API call
  try {
    const baseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
    const testUrl = new URL(`${baseUrl}/webapi`);
    testUrl.searchParams.set('action', 'getmonitorlist');
    testUrl.searchParams.set('token', authResult.token!);
    
    console.log(`🧪 [TEST-CONNECTION] Testing token validity with monitor list...`);
    
    const testResponse = await fetch(testUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    const testResult = await testResponse.text();
    console.log(`📊 [TEST-CONNECTION] Token test response: ${testResponse.status} - ${testResult.substring(0, 100)}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'GP51 connection and authentication verified successfully',
      authMethod: authResult.method,
      tokenValid: testResponse.ok,
      diagnostics: {
        authDetails: authResult.details,
        tokenTestStatus: testResponse.status,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (tokenTestError) {
    console.warn(`⚠️ [TEST-CONNECTION] Token test failed, but auth was successful:`, tokenTestError);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'GP51 authentication successful, but token validation had issues',
      authMethod: authResult.method,
      warning: 'Token test failed - may indicate API limitations',
      diagnostics: {
        authDetails: authResult.details,
        tokenTestError: String(tokenTestError),
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

serve(async (req) => {
  console.log(`📥 Enhanced bulk import: ${req.method} ${req.url}`);

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
    // Get user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing or invalid authorization header' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication failed' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body: ImportRequest = await req.json();
    const { action, username, password } = body;

    console.log(`🔧 Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'test_connection':
        if (!username || !password) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Username and password are required for connection test'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return await testGP51Connection(username, password);

      case 'start_import':
        return new Response(JSON.stringify({
          success: false,
          error: 'Import functionality is currently being rebuilt. Please use the connection test to verify GP51 integration.'
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ Enhanced bulk import error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
