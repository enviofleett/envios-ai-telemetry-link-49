
// Trigger re-deploy - 2025-06-14
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { handleCorsOptionsRequest, CORS_HEADERS } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response_utils.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";
import { getValidGp51Session, GP51Session } from "../_shared/gp51_session_utils.ts";
import { fetchFromGP51 } from "../_shared/gp51_api_client.ts";

interface LiveVehicleTelemetry {
  device_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  status: string;
  odometer?: number;
  fuel_level?: number; // This was in the original interface but not used
  engine_status?: string; // This was in the original interface but not used
  altitude?: number;
  alarm_status?: string; // This was in the original interface but not used
  signal_strength?: number; // This was in the original interface but not used
}

serve(async (req) => {
  const corsResponse = handleCorsOptionsRequest(req);
  if (corsResponse) return corsResponse;

  console.log(`🚀 GP51 Live Data Fetch: ${req.method} ${req.url}`);

  try {
    const supabase = getSupabaseClient();

    // 1. Fetch and validate GP51 session
    const sessionResult = await getValidGp51Session();
    if (sessionResult.errorResponse) return sessionResult.errorResponse;
    const session = sessionResult.session!; // session is guaranteed to be defined here
    
    console.log('✅ Valid session found, fetching live data from GP51...');

    // 2. Fetch device list
    console.log('📡 Fetching GP51 monitor list (devices)...');
    const deviceListResult = await fetchFromGP51({ action: "getDeviceList", session });

    if (deviceListResult.error) {
      // Handle specific auth failure for device list
      if (deviceListResult.status === 401 || deviceListResult.status === 403) {
        return errorResponse(
          "GP51 authentication failed",
          401,
          `HTTP ${deviceListResult.status}: Invalid credentials`,
          "AUTH_FAILED"
        );
      }
      return errorResponse(
        deviceListResult.error,
        deviceListResult.status || 502, // 502 for bad gateway if API error
        deviceListResult.gp51_error || deviceListResult.raw,
        "API_ERROR_DEVICE_LIST"
      );
    }
    
    console.log('✅ Monitor data (device list) fetched successfully');

    let devices = [];
    if (deviceListResult.data.devices && Array.isArray(deviceListResult.data.devices)) {
        devices = deviceListResult.data.devices;
    } else if (deviceListResult.data.groups && Array.isArray(deviceListResult.data.groups)) {
        devices = deviceListResult.data.groups.flatMap((group: any) => group.devices || []);
    } else if (Array.isArray(deviceListResult.data)) { 
        devices = deviceListResult.data;
    }
    console.log(`Extracted ${devices.length} devices. Sample:`, devices.slice(0,2));

    const deviceIds = devices.map((device: any) => device.deviceid || device.id).filter((id: string | number) => id);

    if (deviceIds.length === 0) {
      console.log('⚠️ No devices found in monitor list');
      return jsonResponse({ 
        success: true, 
        data: {
          devices: [],
          telemetry: [],
          total_devices: 0,
          total_positions: 0,
          fetched_at: new Date().toISOString()
        },
        message: 'No devices found for position tracking'
      });
    }

    // 3. Fetch last positions for all devices
    console.log(`📍 Fetching last positions for ${deviceIds.length} devices...`);
    const telemetryData: LiveVehicleTelemetry[] = [];

    const positionApiResult = await fetchFromGP51({
      action: "lastposition",
      session,
      additionalParams: {
        deviceids: deviceIds.join(','),
        lastquerypositiontime: '0'
      }
    });

    if (!positionApiResult.error && positionApiResult.data && positionApiResult.data.records) {
      const positions = Array.isArray(positionApiResult.data.records) ? positionApiResult.data.records : [positionApiResult.data.records];
      
      for (const pos of positions) {
        if (pos.callat !== undefined && pos.callon !== undefined) { // Basic check for valid position data
          telemetryData.push({
            device_id: pos.deviceid?.toString() || 'unknown',
            latitude: parseFloat(pos.callat) / 1000000,
            longitude: parseFloat(pos.callon) / 1000000,
            speed: parseFloat(pos.speed) || 0,
            heading: parseFloat(pos.course) || 0,
            timestamp: new Date(pos.devicetime * 1000).toISOString(), // devicetime is usually seconds epoch
            status: pos.strstatus || pos.strstatusen || 'unknown',
            odometer: pos.totaldistance ? parseFloat(pos.totaldistance) : undefined,
            altitude: pos.altitude ? parseFloat(pos.altitude) : undefined,
          });
        }
      }
      console.log(`✅ Fetched and processed ${telemetryData.length} telemetry records`);
    } else {
      console.warn('⚠️ Position fetch/parse failed or API returned error:', positionApiResult.error, `Status: ${positionApiResult.status}`, positionApiResult.gp51_error);
      // Continue without positions, or return an error based on requirements
    }

    // 4. Update vehicles table with latest telemetry data and store history
    if (telemetryData.length > 0) {
      console.log(`💾 Updating ${telemetryData.length} vehicle records...`);
      
      for (const telem of telemetryData) {
        try {
          // Update main vehicles table
          const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .upsert({
              device_id: telem.device_id,
              latitude: telem.latitude,
              longitude: telem.longitude,
              speed: telem.speed,
              heading: telem.heading,
              last_update: telem.timestamp,
              status: telem.status, // Ensure this status aligns with your vehicle status definitions
              odometer: telem.odometer,
              altitude: telem.altitude,
              updated_at: new Date().toISOString() // Keep Supabase updated_at
            }, {
              onConflict: 'device_id' // Assumes device_id is unique constraint
            })
            .select('id') // Select vehicle ID for history linking
            .single();

          if (vehicleError) {
            console.error(`❌ Failed to upsert vehicle ${telem.device_id}:`, vehicleError);
            continue; // Skip to next telemetry record
          }

          // Store in telemetry history table if vehicle upsert was successful
          if (vehicle && vehicle.id) {
            // Check if vehicle_telemetry_history table exists or is intended
            // This part can be error-prone if the table schema is not guaranteed
            // For robustness, consider checking table existence or handling specific errors like "relation does not exist"
            try {
                await supabase
                .from('vehicle_telemetry_history')
                .insert({
                    vehicle_id: vehicle.id, // Link to your internal vehicle ID
                    device_id: telem.device_id, // GP51 device ID
                    timestamp: telem.timestamp,
                    latitude: telem.latitude,
                    longitude: telem.longitude,
                    speed: telem.speed,
                    heading: telem.heading,
                    odometer: telem.odometer,
                    altitude: telem.altitude,
                    // Add other relevant fields
                });
            } catch (historyError: any) {
                 // Specifically ignore "relation does not exist" or log as warning
                if (historyError.message?.includes("relation") && historyError.message?.includes("does not exist")) {
                    console.warn(`⚠️ Telemetry history table 'vehicle_telemetry_history' may not exist. Skipping history for ${telem.device_id}.`);
                } else {
                    console.warn(`⚠️ Failed to store telemetry history for ${telem.device_id}:`, historyError.message);
                }
            }
          } else {
            console.warn(`⚠️ Vehicle ID not found after upsert for ${telem.device_id}, cannot save history.`);
          }

        } catch (updateError) {
          console.error(`❌ Failed to process telemetry for ${telem.device_id}:`, updateError);
        }
      }
    }

    // 5. Success response
    const responsePayload = {
      success: true,
      data: {
        devices, // Full device list from GP51
        telemetry: telemetryData, // Processed telemetry records
        total_devices: devices.length,
        total_positions: telemetryData.length,
        fetched_at: new Date().toISOString()
      }
    };

    console.log('✅ GP51 live data fetch and database update completed successfully');
    return jsonResponse(responsePayload);
    
  } catch (err) {
    console.error("💥 Unexpected error in fetchLiveGp51Data:", err);
    return errorResponse(
      "Internal server error", 
      500, 
      err instanceof Error ? err.message : String(err),
      "INTERNAL_ERROR"
    );
  }
});
