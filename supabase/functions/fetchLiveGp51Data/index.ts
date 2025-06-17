
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Inlined CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
function handleCorsOptionsRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  return null;
}

// Inlined response utilities
function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown,
  code?: string,
): Response {
  const errorPayload: { success: boolean; error: string; code?: string; details?: unknown } = {
    success: false,
    error: message,
  };
  if (code) errorPayload.code = code;
  if (details) errorPayload.details = details;
  
  return new Response(JSON.stringify(errorPayload), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// Inlined GP51 session interface
interface GP51Session {
  username: string;
  password_hash?: string;
  gp51_token: string;
  token_expires_at?: string;
  envio_user_id: string;
}

// Inlined session validation function
async function getValidGp51Session(supabase: any): Promise<{ session?: GP51Session; errorResponse?: Response }> {
  const { data: sessionData, error: sessionError } = await supabase
    .from("gp51_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError) {
    console.error("❌ Database error fetching session:", sessionError);
    return { 
      errorResponse: errorResponse(
        "Database error accessing GP51 sessions", 
        500, 
        sessionError.message,
        "DATABASE_ERROR"
      ) 
    };
  }

  if (!sessionData) {
    console.log("❌ No GP51 sessions found - GP51 not configured");
    return { 
      errorResponse: errorResponse(
        "GP51 integration not configured", 
        400, 
        "Please configure GP51 credentials in the admin settings.",
        "NO_GP51_CONFIG"
      ) 
    };
  }
  
  const session = sessionData as GP51Session;

  if (!session.gp51_token) {
    console.error("❌ GP51 session in database is missing a token.");
    return {
      errorResponse: errorResponse(
        "GP51 session is invalid (missing token)",
        401,
        "Session is invalid, please re-authenticate in admin settings.",
        "INVALID_SESSION"
      )
    };
  }

  if (session.token_expires_at) {
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();
    if (expiresAt <= now) {
      console.error('❌ GP51 session expired:', { expiresAt, now });
      return { 
        errorResponse: errorResponse(
          'GP51 session expired', 
          401, 
          'Session expired, please refresh credentials',
          'SESSION_EXPIRED'
        ) 
      };
    }
  }

  return { session };
}

// Inlined GP51 API client functionality
interface FetchGP51Options {
  action: string;
  session: GP51Session;
  additionalParams?: Record<string, string>;
}

interface FetchGP51Response {
  data?: any;
  error?: string;
  status?: number;
  gp51_error?: any;
  raw?: string;
}

async function fetchFromGP51(options: FetchGP51Options): Promise<FetchGP51Response> {
  const { action, session, additionalParams = {} } = options;

  if (!session.gp51_token) {
    console.error("❌ GP51 session is missing a token.");
    return { error: 'GP51 session is invalid (missing token)', status: 401 };
  }
  
  try {
    const apiUrl = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com/webapi';
    
    // Prepare URL with action, token and username as query parameters
    const url = new URL(apiUrl);
    url.searchParams.set('action', action);
    url.searchParams.set('token', session.gp51_token);
    url.searchParams.set('username', session.username);
    
    // Add any additional parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    console.log(`📡 Making GP51 API request: ${action}`);
    console.log(`🔗 URL: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log(`📊 GP51 API response received, length: ${responseText.length}`);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse GP51 response as JSON:', parseError);
      return { 
        error: 'Invalid JSON response from GP51 API', 
        status: 502,
        raw: responseText 
      };
    }

    // Validate GP51 response format
    if (!result || typeof result.status !== 'number') {
      console.error('❌ Invalid GP51 response format:', result);
      return { 
        error: 'Invalid response format from GP51 API', 
        status: 502,
        gp51_error: result 
      };
    }

    if (result.status !== 0) {
      console.error(`❌ GP51 API returned error status: ${result.status}, Message: ${result.cause}`);
      return { 
        error: `GP51 API error: ${result.cause}`, 
        status: 400,
        gp51_error: result 
      };
    }

    console.log(`✅ GP51 API call successful for action: ${action}`);
    return { data: result, status: 200 };
    
  } catch (error) {
    console.error(`❌ GP51 API call failed for ${action}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : `${action} failed`;
    
    // Check if it's a timeout error
    if (error.name === 'AbortError') {
      return { error: 'Request timeout', status: 408 };
    }
    
    // Check if it's a network error
    if (errorMessage.includes('HTTP error')) {
      const statusMatch = errorMessage.match(/HTTP error: (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 502;
      return { error: errorMessage, status };
    }
    
    return { 
      error: errorMessage, 
      status: 400,
      gp51_error: { cause: errorMessage }
    };
  }
}

// Simplified telemetry structure for the client
interface LiveVehicleTelemetry {
  deviceId: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: string;
  statusText: string;
  isOnline: boolean;
  isMoving: boolean;
}

interface PositionRequest {
  deviceids?: string; // Comma-separated string of device IDs
}

serve(async (req) => {
  const corsResponse = handleCorsOptionsRequest(req);
  if (corsResponse) return corsResponse;

  console.log(`🚀 GP51 Position Fetch: ${req.method} ${req.url}`);

  try {
    let body: PositionRequest | null = null;
    try {
      body = await req.json();
    } catch {
      // Ignore JSON parsing errors if the body is empty, which can happen on simple pings.
    }
    const deviceids = body?.deviceids;

    console.log(`📋 Request body: ${JSON.stringify(body)}`);
    console.log(`🔢 Device IDs: ${deviceids || 'none provided'}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get valid GP51 session
    const sessionResult = await getValidGp51Session(supabase);
    if (sessionResult.errorResponse) return sessionResult.errorResponse;
    const session = sessionResult.session!;

    console.log(`✅ Using GP51 session for user: ${session.username}`);

    // If no device IDs provided, fetch all devices first
    if (!deviceids || deviceids.length === 0) {
      console.log('📡 No device IDs provided, fetching all devices first...');
      
      const devicesResult = await fetchFromGP51({
        action: "querymonitorlist",
        session
      });

      if (devicesResult.error) {
        return errorResponse(
          devicesResult.error,
          devicesResult.status || 502,
          devicesResult.gp51_error || devicesResult.raw,
          "API_ERROR_DEVICE_FETCH"
        );
      }

      const groups = devicesResult.data?.groups || [];
      const allDevices: any[] = [];
      
      for (const group of groups) {
        if (group.devices && Array.isArray(group.devices)) {
          allDevices.push(...group.devices);
        }
      }

      console.log(`📋 Found ${allDevices.length} devices across ${groups.length} groups`);

      if (allDevices.length === 0) {
        return jsonResponse({ 
          success: true, 
          telemetry: [],
          message: 'No devices found in GP51 account'
        });
      }

      // Use all device IDs for position fetch
      const allDeviceIds = allDevices.map(device => device.deviceid).join(',');
      console.log(`🎯 Fetching positions for all ${allDevices.length} devices`);

      const positionResult = await fetchFromGP51({
        action: "lastposition",
        session,
        additionalParams: {
          deviceids: allDeviceIds,
          lastquerypositiontime: '0'
        }
      });

      if (positionResult.error) {
        return errorResponse(
          positionResult.error,
          positionResult.status || 502,
          positionResult.gp51_error || positionResult.raw,
          "API_ERROR_POSITION_FETCH"
        );
      }

      const records = positionResult.data?.records || [];
      const positions = Array.isArray(records) ? records : [records];
      
      const telemetryData: LiveVehicleTelemetry[] = positions
        .filter((pos: any) => pos.callat !== undefined && pos.callon !== undefined && !isNaN(parseFloat(pos.callat)))
        .map((pos: any) => ({
          deviceId: pos.deviceid?.toString() || 'unknown',
          latitude: parseFloat(pos.callat) / 1000000,
          longitude: parseFloat(pos.callon) / 1000000,
          speed: parseFloat(pos.speed) || 0,
          course: parseFloat(pos.course) || 0,
          timestamp: new Date((pos.devicetime || 0) * 1000).toISOString(),
          statusText: pos.strstatus || pos.strstatusen || 'unknown',
          isOnline: (Date.now() - ((pos.devicetime || 0) * 1000)) < 10 * 60 * 1000,
          isMoving: (parseFloat(pos.speed) || 0) > 2,
        }));

      console.log(`✅ Processed ${telemetryData.length} telemetry records from ${positions.length} position records`);

      return jsonResponse({ 
        success: true, 
        telemetry: telemetryData,
        data: {
          total_devices: allDevices.length,
          total_positions: positions.length,
          fetched_at: new Date().toISOString()
        }
      });
    } else {
      // Fetch positions for specific device IDs
      console.log(`📍 Fetching last positions for specific devices: ${deviceids}`);

      const positionApiResult = await fetchFromGP51({
        action: "lastposition",
        session,
        additionalParams: {
          deviceids: deviceids,
          lastquerypositiontime: '0'
        }
      });

      if (positionApiResult.error) {
        return errorResponse(
          positionApiResult.error,
          positionApiResult.status || 502,
          positionApiResult.gp51_error || positionApiResult.raw,
          "API_ERROR_POSITION_FETCH"
        );
      }
      
      const records = positionApiResult.data?.records || [];
      const positions = Array.isArray(records) ? records : [records];
      
      const telemetryData: LiveVehicleTelemetry[] = positions
        .filter((pos: any) => pos.callat !== undefined && pos.callon !== undefined && !isNaN(parseFloat(pos.callat)))
        .map((pos: any) => ({
          deviceId: pos.deviceid?.toString() || 'unknown',
          latitude: parseFloat(pos.callat) / 1000000,
          longitude: parseFloat(pos.callon) / 1000000,
          speed: parseFloat(pos.speed) || 0,
          course: parseFloat(pos.course) || 0,
          timestamp: new Date((pos.devicetime || 0) * 1000).toISOString(),
          statusText: pos.strstatus || pos.strstatusen || 'unknown',
          isOnline: (Date.now() - ((pos.devicetime || 0) * 1000)) < 10 * 60 * 1000, 
          isMoving: (parseFloat(pos.speed) || 0) > 2,
        }));

      console.log(`✅ Fetched and processed ${telemetryData.length} telemetry records`);

      return jsonResponse({ 
        success: true, 
        telemetry: telemetryData,
        data: {
          total_devices: deviceids.split(',').length,
          total_positions: positions.length,
          fetched_at: new Date().toISOString()
        }
      });
    }

  } catch (err) {
    console.error("💥 Unexpected error in fetchLiveGp51Data:", err);
    return errorResponse("Internal server error", 500, err instanceof Error ? err.message : String(err));
  }
});
