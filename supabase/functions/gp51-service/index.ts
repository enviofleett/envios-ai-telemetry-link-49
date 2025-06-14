import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_sync } from "../_shared/crypto_utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51LoginRequest {
  username: string;
  password: string;
  from?: string;
  type?: string;
}

interface GP51ApiResponse {
  status: number; // GP51 specific status, 0 for success
  cause?: string;
  token?: string;
  message?: string;
  groups?: any[]; 
  records?: any[]; 
}

async function callGP51Api(action: string, params: Record<string, any>, token?: string): Promise<GP51ApiResponse> {
  const GP51_BASE_URL = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
  
  let url = `${GP51_BASE_URL}/webapi?action=${encodeURIComponent(action)}`;
  const requestBody: Record<string, any> = { ...params }; // Clone params to avoid modifying original

  if (token) {
    url += `&token=${encodeURIComponent(token)}`;
  }
  
  console.log(`📞 Calling GP51 API: Action='${action}', URL='${url}'`, params.password ? { ...params, password: '***'} : params);
  
  const response = await fetch(url, {
    method: 'POST', // GP51 primarily uses POST
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded', // GP51 often uses this
      'Accept': 'application/json',
      'User-Agent': 'EnvioFleet/1.0/GP51Service'
    },
    body: new URLSearchParams(requestBody).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ GP51 API request failed for action '${action}': ${response.status} ${response.statusText}`, errorText.substring(0,500));
    throw new Error(`GP51 API request failed: ${response.status} ${response.statusText}. Response: ${errorText.substring(0,100)}`);
  }

  const responseText = await response.text();
  console.log(`📄 Raw GP51 API response for '${action}' (first 200 chars):`, responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
  
  try {
    const result = JSON.parse(responseText);
    console.log(`✅ GP51 API response for '${action}' (parsed):`, { status: result.status, cause: result.cause, token_present: !!result.token });
    return result as GP51ApiResponse;
  } catch (e) {
    console.error(`❌ Failed to parse JSON response from GP51 for action '${action}':`, e.message, responseText.substring(0,500));
    throw new Error(`Invalid JSON response from GP51 for action '${action}'. Preview: ${responseText.substring(0,100)}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { action, ...params } = requestBody; // Use params for clarity
  console.log(`🚀 GP51 Service request received. Action: '${action}'`, params.password ? { ...params, password: '***'} : params);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use SERVICE_ROLE_KEY for database operations
    );

    switch (action) {
      case 'login': {
        const { username, password, from = 'WEB', type = 'USER' }: GP51LoginRequest = params;
        
        if (!username || !password) {
          return new Response(
            JSON.stringify({ success: false, error: 'Username and password are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const hashedPassword = md5_sync(password); // Changed to md5_sync
        
        const loginParams = {
          username: username.trim(),
          password: hashedPassword,
          from,
          type
        };
        
        const loginResult = await callGP51Api('login', loginParams);

        if (loginResult.status === 0 && loginResult.token) {
          const { error: sessionError } = await supabase
            .from('gp51_sessions') // Ensure this table exists
            .upsert({
              username: username.trim(),
              password_hash: hashedPassword, // Store the hash of the original password
              gp51_token: loginResult.token,
              auth_method: 'POST_FORM_SERVICE', // Identify auth method
              token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24hr
              last_validated_at: new Date().toISOString(),
            }, { onConflict: 'username' });

          if (sessionError) {
            console.warn('⚠️ Failed to store GP51 session:', sessionError.message);
            // Decide if this is critical. For login, usually not.
          }

          return new Response(
            JSON.stringify({
              success: true,
              token: loginResult.token,
              username: username.trim(),
              message: "Login successful."
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: loginResult.cause || loginResult.message || 'GP51 authentication failed.',
              gp51_status: loginResult.status
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'logout': {
        const { token } = params; // token from request body
        
        if (!token) {
             return new Response(
                JSON.stringify({ success: false, error: 'Token is required for logout.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        try {
          await callGP51Api('logout', {}, token); 
          console.log(`Logout call to GP51 API for token (prefix): ${String(token).substring(0,5)}... completed.`);
        } catch (error) {
          console.warn('⚠️ GP51 logout API call failed (this might be normal if token was already invalid):', error.message);
        }

        const { error: deleteError } = await supabase
          .from('gp51_sessions')
          .delete()
          .eq('gp51_token', token);

        if (deleteError) {
            console.warn('⚠️ Failed to delete session from database during logout:', deleteError.message);
        }

        return new Response(
          JSON.stringify({ success: true, message: "Logout processed." }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'health_check': // Renamed for consistency, or keep 'test_connection'
      case 'test_connection': {
        const { token } = params;
        
        if (!token) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Token is required for health check.'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const result = await callGP51Api('getDeviceList', {}, token); // 'getDeviceList' action for GP51
          
          const healthy = result.status === 0;
          return new Response(
            JSON.stringify({
              success: true, // The function call itself succeeded
              healthy: healthy, // GP51 connection is healthy
              message: healthy ? "GP51 connection is healthy." : (result.cause || result.message || "GP51 health check failed."),
              gp51_status: result.status,
              details: healthy ? result : { cause: result.cause, message: result.message }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false, // The function call failed
              healthy: false,
              error: "Failed to perform GP51 health check.",
              details: error instanceof Error ? error.message : String(error)
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // Return 200, but healthy: false
          );
        }
      }

      case 'get_devices': // Or 'getDeviceList' to match GP51 action name
      case 'getDeviceList': {
        const { token } = params;
        
        if (!token) {
          return new Response(
            JSON.stringify({ success: false, error: 'Token is required to get devices.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const result = await callGP51Api('getDeviceList', {}, token); // Standardized action name
          
          if (result.status === 0) {
            const devices = result.groups?.flatMap((group: any) => group.devices || []) || result.records || [];
            
            return new Response(
              JSON.stringify({
                success: true,
                devices,
                deviceCount: devices.length,
                message: `Fetched ${devices.length} devices.`
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            return new Response(
              JSON.stringify({
                success: false,
                error: result.cause || result.message || 'Failed to fetch devices from GP51.',
                gp51_status: result.status
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // 200 but success: false
            );
          }
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Failed to fetch devices due to an internal error.",
              details: error instanceof Error ? error.message : String(error)
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('💥 GP51 Service function error:', error.message, error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error in GP51 service function.',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
