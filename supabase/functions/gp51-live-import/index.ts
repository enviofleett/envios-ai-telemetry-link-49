import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Md5 } from "https://deno.land/std@0.208.0/hash/md5.ts";

// ENV
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GP51_API_URL = "https://www.gps51.com/webapi";
const REQUEST_TIMEOUT = 5000;
const MAX_RETRIES = 2;

// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// MD5 hash function for password hashing
function md5(input: string): string {
  const md5Hasher = new Md5();
  md5Hasher.update(input);
  return md5Hasher.toString();
}

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function callGP51WithRetry(
  formData: URLSearchParams, 
  attempt: number = 1
): Promise<{ success: boolean; response?: Response; error?: string; statusCode?: number }> {
  try {
    console.log(`GP51 API call attempt ${attempt}/${MAX_RETRIES + 1}`);
    console.log('Form data:', Object.fromEntries(formData.entries()));
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(GP51_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      body: formData.toString(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`GP51 API response: status=${response.status}`);
    
    return { success: true, response, statusCode: response.status };
    
  } catch (error) {
    console.error(`GP51 API attempt ${attempt} failed:`, error);
    
    if (attempt <= MAX_RETRIES) {
      const delay = attempt * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGP51WithRetry(formData, attempt + 1);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error',
      statusCode: 0
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 GP51 Live Import: Starting data fetch...');

    // 1. Fetch latest valid session from gp51_sessions - FIXED: Using maybeSingle()
    const { data: session, error: sessionError } = await supabase
      .from("gp51_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error("❌ Database error fetching session:", sessionError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Database error accessing GP51 sessions",
          code: "DATABASE_ERROR",
          details: sessionError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!session) {
      console.log("❌ No GP51 sessions found - GP51 not configured");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "GP51 integration not configured",
          code: "NO_GP51_CONFIG",
          message: "Please configure GP51 credentials in the admin settings before using this feature.",
          action_required: "Configure GP51 credentials in Admin Settings > GP51 Integration"
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Check session expiry if token_expires_at is available and reliable
    if (session.token_expires_at) {
        const expiresAt = new Date(session.token_expires_at);
        const now = new Date();
        if (expiresAt <= now) {
            console.error('❌ GP51 session expired:', { expiresAt, now });
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'GP51 session expired',
                    code: 'SESSION_EXPIRED',
                    details: 'Session expired, please refresh credentials'
                }),
                { 
                    status: 401, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }
    }

    const { username, password_hash } = session;

    // Hash the password for GP51 authentication
    const hashedPassword = md5(password_hash);

    const fetchFromGP51 = async (action: string, additionalParams: Record<string, string> = {}, retry = false) => {
      const formData = new URLSearchParams({
        action,
        username,
        password: hashedPassword,
        from: 'WEB',
        type: 'USER',
        ...additionalParams
      });

      const result = await callGP51WithRetry(formData);
      
      if (!result.success) {
        return { error: result.error || 'Network error', status: result.statusCode || 502 };
      }

      const response = result.response!;
      
      if (!response.ok) {
        console.error(`❌ GP51 API HTTP error for ${action}: ${response.status} ${response.statusText}`);
        return { error: `HTTP ${response.status}: ${response.statusText}`, status: response.status };
      }

      const text = await response.text();
      console.log(`📊 Raw GP51 ${action} response (first 500 chars):`, text.substring(0, 500) + (text.length > 500 ? '...' : ''));

      try {
        const json = JSON.parse(text);

        if (json.status !== 0) {
          console.error(`🛑 GP51 API ${action} returned error status:`, json.cause || json.message, json);
          // It's better to return the full GP51 error if available
          return { 
            error: json.cause || json.message || `${action} failed`, 
            status: response.status === 200 ? 400 : response.status, // If GP51 returns error with HTTP 200, use 400
            gp51_error: json // include full GP51 error object
          };
        }

        return { data: json, status: 200 };
      } catch (e) {
        // Avoid retry loops for non-JSON responses that are persistent
        // For now, keeping the retry logic as it was, but this could be refined.
        if (!retry) {
          console.warn(`🔁 Retry ${action} after JSON parse failure (response was not JSON):`, text.substring(0, 200));
          return await fetchFromGP51(action, additionalParams, true);
        }

        console.error(`❌ GP51 ${action} returned invalid JSON after retry:`, text.substring(0, 200));
        return { error: `Invalid GP51 ${action} response (not JSON)`, raw: text, status: 502 };
      }
    };

    // 3. Attempt to fetch monitor list (device list)
    console.log('📡 Fetching GP51 monitor list (devices)...');
    // CHANGED action from "querymonitorlist" to "getDeviceList"
    const result = await fetchFromGP51("getDeviceList"); 

    if (result.error) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error,
        code: result.status === 401 ? "AUTH_FAILED" : "API_ERROR",
        gp51_error: result.gp51_error // include GP51 specific error if present
      }), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract devices, adapting to potential variations in GP51 response structure
    let devices = [];
    if (result.data.devices && Array.isArray(result.data.devices)) {
        devices = result.data.devices;
    } else if (result.data.groups && Array.isArray(result.data.groups)) {
        // This was the previous logic, keep as a fallback if 'devices' top-level array isn't present
        devices = result.data.groups.flatMap((group: any) => group.devices || []);
    } else if (Array.isArray(result.data)) { // Sometimes APIs return a direct array for lists
        devices = result.data;
    }
    console.log(`✅ Found ${devices.length} devices in monitor list. Sample:`, devices.slice(0,2));


    // 4. Fetch positions for devices if any exist
    let positions = [];
    if (devices.length > 0) {
      const deviceIds = devices.map((d: any) => d.deviceid || d.id).filter((id: string | number) => id); // deviceid can be number
      
      if (deviceIds.length > 0) {
        console.log(`📍 Fetching positions for ${deviceIds.length} devices...`);
        
        const positionResult = await fetchFromGP51("lastposition", {
          deviceids: deviceIds.join(','),
          lastquerypositiontime: '0' // Fetch latest positions
        });
        
        if (!positionResult.error && positionResult.data && positionResult.data.records) {
          positions = Array.isArray(positionResult.data.records) ? positionResult.data.records : [positionResult.data.records];
          console.log(`✅ Fetched ${positions.length} position records`);
        } else {
          console.warn('⚠️ Position fetch failed or API returned error:', positionResult.error, positionResult.gp51_error);
        }
      }
    }

    // 5. Success: return comprehensive data
    const responseData = {
      success: true,
      data: {
        devices,
        positions,
        total_devices: devices.length,
        total_positions: positions.length,
        fetched_at: new Date().toISOString()
      }
    };

    console.log('✅ GP51 live import completed successfully');
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (err) {
    console.error("💥 Unexpected error in gp51-live-import:", err);
    return new Response(JSON.stringify({ 
      success: false,
      error: "Internal error", 
      details: err instanceof Error ? err.message : 'Unknown error',
      code: "INTERNAL_ERROR"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
