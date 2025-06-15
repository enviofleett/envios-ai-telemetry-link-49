
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCorsOptionsRequest } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response_utils.ts";
import { getValidGp51Session } from "../_shared/gp51_session_utils.ts";
import { fetchFromGP51 } from "../_shared/gp51_api_client.ts";

interface PositionRequest {
  deviceids?: string; // Comma-separated string of device IDs
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

    if (!deviceids || deviceids.length === 0) {
      console.log('⚠️ No device IDs provided for position fetch. Returning empty array.');
      return jsonResponse({ success: true, telemetry: [] });
    }

    const sessionResult = await getValidGp51Session();
    if (sessionResult.errorResponse) return sessionResult.errorResponse;
    const session = sessionResult.session!;

    console.log(`📍 Fetching last positions for ${deviceids.split(',').length} devices...`);

    const positionApiResult = await fetchFromGP51({
      action: "lastposition",
      session,
      additionalParams: {
        deviceids: deviceids,
        lastquerypositiontime: '0' // Get latest position
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

    return jsonResponse({ success: true, telemetry: telemetryData });

  } catch (err) {
    console.error("💥 Unexpected error in fetchLiveGp51Data:", err);
    return errorResponse("Internal server error", 500, err instanceof Error ? err.message : String(err));
  }
});
