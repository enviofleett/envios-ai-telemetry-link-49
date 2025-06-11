
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ENV
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GP51_API_URL = "https://api.gpstrackerxy.com/api";

// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
        { status: 401, headers: corsHeaders }
      );
    }

    const { username: suser, gp51_token: stoken } = session;

    // 2. Build POST body for monitor list
    const formData = new URLSearchParams({
      action: "querymonitorlist",
      json: "1",
      suser,
      stoken,
    });

    const fetchFromGP51 = async (action: string, params: URLSearchParams, retry = false) => {
      const res = await fetch(GP51_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "User-Agent": "EnvioFleet/1.0"
        },
        body: params.toString(),
      });

      if (!res.ok) {
        console.error(`❌ GP51 API HTTP error for ${action}: ${res.status} ${res.statusText}`);
        return { error: `HTTP ${res.status}: ${res.statusText}`, status: res.status };
      }

      const text = await res.text();
      console.log(`📊 Raw GP51 ${action} response:`, text.substring(0, 500) + '...');

      try {
        const json = JSON.parse(text);

        if (json.result === "false" || json.result === false) {
          console.error(`🛑 GP51 API ${action} returned false:`, json.message);
          return { error: json.message || `${action} failed`, status: 401 };
        }

        return { data: json.devices || json.result || json, status: 200 };
      } catch (e) {
        if (!retry) {
          console.warn(`🔁 Retry ${action} after JSON parse failure:`, text.substring(0, 200));
          return await fetchFromGP51(action, params, true);
        }

        console.error(`❌ GP51 ${action} returned invalid JSON:`, text.substring(0, 200));
        return { error: `Invalid GP51 ${action} response`, raw: text, status: 502 };
      }
    };

    // 3. Attempt to fetch monitor list
    console.log('📡 Fetching GP51 monitor list...');
    const result = await fetchFromGP51("querymonitorlist", formData);

    if (result.error) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error,
        code: "API_ERROR"
      }), {
        status: result.status,
        headers: corsHeaders,
      });
    }

    const devices = result.data || [];
    console.log(`✅ Found ${devices.length} devices in monitor list`);

    // 4. Fetch positions for devices if any exist
    let positions = [];
    if (devices.length > 0) {
      const deviceIds = devices.map((d: any) => d.deviceid || d.id).filter((id: string) => id);
      
      if (deviceIds.length > 0) {
        console.log(`📍 Fetching positions for ${deviceIds.length} devices...`);
        
        const positionParams = new URLSearchParams({
          action: "lastposition",
          json: "1",
          suser,
          stoken,
          deviceids: deviceIds.join(',')
        });

        const positionResult = await fetchFromGP51("lastposition", positionParams);
        
        if (!positionResult.error && positionResult.data) {
          positions = Array.isArray(positionResult.data) ? positionResult.data : [positionResult.data];
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
      headers: corsHeaders,
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
      headers: corsHeaders,
    });
  }
});
