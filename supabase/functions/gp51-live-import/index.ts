
// Trigger re-deploy - 2025-06-14
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCorsOptionsRequest, CORS_HEADERS } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response_utils.ts";
import { getValidGp51Session } from "../_shared/gp51_session_utils.ts";
import { fetchFromGP51 } from "../_shared/gp51_api_client.ts";

serve(async (req) => {
  const corsResponse = handleCorsOptionsRequest(req);
  if (corsResponse) return corsResponse;

  try {
    console.log('🚀 GP51 Live Import: Starting data fetch...');

    // 1. Fetch and validate GP51 session
    const sessionResult = await getValidGp51Session();
    if (sessionResult.errorResponse) return sessionResult.errorResponse;
    const session = sessionResult.session!;

    // 2. Fetch device list
    console.log('📡 Fetching GP51 monitor list (devices)...');
    const deviceListResult = await fetchFromGP51({ action: "getDeviceList", session });

    if (deviceListResult.error) {
      return errorResponse(
        deviceListResult.error,
        deviceListResult.status || 500,
        deviceListResult.gp51_error,
        deviceListResult.status === 401 ? "AUTH_FAILED" : "API_ERROR"
      );
    }

    let devices = [];
    if (deviceListResult.data.devices && Array.isArray(deviceListResult.data.devices)) {
        devices = deviceListResult.data.devices;
    } else if (deviceListResult.data.groups && Array.isArray(deviceListResult.data.groups)) {
        devices = deviceListResult.data.groups.flatMap((group: any) => group.devices || []);
    } else if (Array.isArray(deviceListResult.data)) { 
        devices = deviceListResult.data;
    }
    console.log(`✅ Found ${devices.length} devices in monitor list. Sample:`, devices.slice(0,2));

    // 3. Fetch positions for devices if any exist
    let positions = [];
    if (devices.length > 0) {
      const deviceIds = devices.map((d: any) => d.deviceid || d.id).filter((id: string | number) => id);
      
      if (deviceIds.length > 0) {
        console.log(`📍 Fetching positions for ${deviceIds.length} devices...`);
        
        const positionResult = await fetchFromGP51({
          action: "lastposition",
          session,
          additionalParams: {
            deviceids: deviceIds.join(','),
            lastquerypositiontime: '0'
          }
        });
        
        if (!positionResult.error && positionResult.data && positionResult.data.records) {
          positions = Array.isArray(positionResult.data.records) ? positionResult.data.records : [positionResult.data.records];
          console.log(`✅ Fetched ${positions.length} position records`);
        } else {
          console.warn('⚠️ Position fetch failed or API returned error:', positionResult.error, positionResult.gp51_error);
          // Optionally return an error or partial data here
        }
      }
    }

    // 4. Success: return comprehensive data
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
    return jsonResponse(responseData);
    
  } catch (err) {
    console.error("💥 Unexpected error in gp51-live-import:", err);
    return errorResponse(
      "Internal error", 
      500, 
      err instanceof Error ? err.message : 'Unknown error',
      "INTERNAL_ERROR"
    );
  }
});
