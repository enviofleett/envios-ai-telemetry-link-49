
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getGP51ApiUrl, isValidGP51BaseUrl } from '../_shared/constants.ts';
import { md5_for_gp51_only, checkRateLimit, sanitizeInput } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`📥 [GP51-SERVICE] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    console.log('📥 [GP51-SERVICE] OPTIONS - returning CORS headers');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, username, password, apiUrl } = body;

    console.log(`🌍 [GP51-SERVICE] IP: ${req.headers.get('x-forwarded-for') || 'unknown'}`);
    console.log(`📋 [GP51-SERVICE] Action: ${action}, Username: ${username?.substring(0, 3)}***`);

    // Use standardized URL construction
    const gp51BaseUrl = apiUrl || Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
    const gp51ApiUrl = getGP51ApiUrl(gp51BaseUrl);
    
    console.log(`🌐 [GP51-SERVICE] Using API URL: ${gp51ApiUrl}`);
    
    // Validate the base URL if provided
    if (apiUrl && !isValidGP51BaseUrl(apiUrl)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid GP51 base URL provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Rate limiting
    if (!checkRateLimit(clientIP, 20, 60 * 1000)) { // 20 requests per minute
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Too many requests. Please try again later.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'authenticate') {
      return await authenticateWithGP51(gp51ApiUrl, username, password);
    } else if (action === 'getVehicles') {
      const token = body.token;
      return await getVehiclesFromGP51(gp51ApiUrl, token);
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [GP51-SERVICE] Request processing failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function authenticateWithGP51(apiUrl: string, username: string, password: string) {
  console.log(`🔐 [GP51-AUTH] Starting authentication for user: ${username?.substring(0, 3)}***`);
  
  try {
    const hashedPassword = await md5_for_gp51_only(password);
    
    const loginUrl = new URL(apiUrl);
    loginUrl.searchParams.set('action', 'login');
    loginUrl.searchParams.set('username', sanitizeInput(username));
    loginUrl.searchParams.set('password', hashedPassword);
    loginUrl.searchParams.set('from', 'WEB');
    loginUrl.searchParams.set('type', 'USER');

    const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    if (globalToken) {
      loginUrl.searchParams.set('token', globalToken);
    }

    console.log(`📡 [GP51-AUTH] Making request to: ${loginUrl.toString()}`);

    const response = await fetch(loginUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'EnvioFleet/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });

    const responseText = await response.text();
    console.log(`📄 [GP51-AUTH] Raw Response: ${responseText}`);

    if (!response.ok) {
      throw new Error(`GP51 API Error: ${response.status} - ${responseText}`);
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { token: responseText.trim(), status: responseText.trim() ? 0 : 1 };
    }

    if (responseData.status === 0 || (responseData.token && responseData.token.length > 0)) {
      console.log('✅ [GP51-AUTH] Authentication successful');
      return new Response(
        JSON.stringify({
          success: true,
          token: responseData.token || responseText.trim(),
          username: username,
          apiUrl: apiUrl
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      const errorMessage = responseData.cause || responseData.message || 'Authentication failed';
      console.error('❌ [GP51-AUTH] Authentication failed:', errorMessage);
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('❌ [GP51-AUTH] Request failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function getVehiclesFromGP51(apiUrl: string, token: string) {
  console.log('🚗 [GP51-VEHICLES] Fetching vehicles from GP51');
  
  try {
    const vehiclesUrl = new URL(apiUrl);
    vehiclesUrl.searchParams.set('action', 'querymonitorlist');
    vehiclesUrl.searchParams.set('token', token);

    const response = await fetch(vehiclesUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`GP51 API Error: ${response.status}`);
    }

    const responseData = await response.json();
    
    if (responseData.status === 0) {
      console.log('✅ [GP51-VEHICLES] Vehicles fetched successfully');
      return new Response(
        JSON.stringify({
          success: true,
          vehicles: responseData.groups || []
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      const errorMessage = responseData.cause || 'Failed to fetch vehicles';
      console.error('❌ [GP51-VEHICLES] Failed to fetch vehicles:', errorMessage);
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('❌ [GP51-VEHICLES] Request failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
