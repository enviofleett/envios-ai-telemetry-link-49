
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
async function md5(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    // 1. Fetch latest valid session from gp51_sessions
    const { data: session, error: sessionError } = await supabase
      .from("gp51_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      console.error("❌ No session found:", sessionError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "No valid GP51 session found",
          code: "NO_SESSION"
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { username, gp51_password } = session;

    // Hash the password for GP51 authentication
    const hashedPassword = await md5(gp51_password);

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
      console.log(`📊 Raw GP51 ${action} response:`, text.substring(0, 500) + '...');

      try {
        const json = JSON.parse(text);

        if (json.status !== 0) {
          console.error(`🛑 GP51 API ${action} returned error status:`, json.cause || json.message);
          return { error: json.cause || json.message || `${action} failed`, status: 401 };
        }

        return { data: json, status: 200 };
      } catch (e) {
        if (!retry) {
          console.warn(`🔁 Retry ${action} after JSON parse failure:`, text.substring(0, 200));
          return await fetchFromGP51(action, additionalParams, true);
        }

        console.error(`❌ GP51 ${action} returned invalid JSON:`, text.substring(0, 200));
        return { error: `Invalid GP51 ${action} response`, raw: text, status: 502 };
      }
    };

    // 3. Attempt to fetch monitor list
    console.log('📡 Fetching GP51 monitor list...');
    const result = await fetchFromGP51("querymonitorlist");

    if (result.error) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error,
        code: "API_ERROR"
      }), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const devices = result.data.groups ? 
      result.data.groups.flatMap((group: any) => group.devices || []) : [];
    console.log(`✅ Found ${devices.length} devices in monitor list`);

    // 4. Fetch positions for devices if any exist
    let positions = [];
    if (devices.length > 0) {
      const deviceIds = devices.map((d: any) => d.deviceid || d.id).filter((id: string) => id);
      
      if (deviceIds.length > 0) {
        console.log(`📍 Fetching positions for ${deviceIds.length} devices...`);
        
        const positionResult = await fetchFromGP51("lastposition", {
          deviceids: deviceIds.join(','),
          lastquerypositiontime: '0'
        });
        
        if (!positionResult.error && positionResult.data && positionResult.data.records) {
          positions = Array.isArray(positionResult.data.records) ? positionResult.data.records : [positionResult.data.records];
          console.log(`✅ Fetched ${positions.length} position records`);
        } else {
          console.warn('⚠️ Position fetch failed:', positionResult.error);
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
