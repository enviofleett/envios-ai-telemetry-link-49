
// Trigger re-deploy - 2025-06-16
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCorsOptionsRequest, CORS_HEADERS } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response_utils.ts";
import { getValidGp51Session } from "../_shared/gp51_session_utils.ts";
import { fetchFromGP51 } from "../_shared/gp51_api_client.ts";

serve(async (req) => {
  const corsResponse = handleCorsOptionsRequest(req);
  if (corsResponse) return corsResponse;

  try {
    console.log('🚀 GP51 Live Import: Starting data fetch and persistence...');

    // 1. Fetch and validate GP51 session
    const sessionResult = await getValidGp51Session();
    if (sessionResult.errorResponse) return sessionResult.errorResponse;
    const session = sessionResult.session!;

    // 2. Initialize Supabase client for data persistence
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Fetch device list from GP51
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
    console.log(`✅ Found ${devices.length} devices in monitor list.`);

    // 4. Fetch positions for devices if any exist
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
        }
      }
    }

    // 5. Transform and persist data to vehicles table
    if (devices.length > 0) {
      console.log('💾 Transforming and persisting vehicle data...');
      
      // Create position lookup map for efficiency
      const positionMap = new Map();
      positions.forEach((pos: any) => {
        const deviceId = pos.deviceid || pos.DeviceId;
        if (deviceId) {
          positionMap.set(deviceId.toString(), pos);
        }
      });

      // Transform devices to vehicle records
      const vehiclesToUpsert = devices.map((device: any) => {
        const deviceId = (device.deviceid || device.id).toString();
        const position = positionMap.get(deviceId);
        
        // Determine status based on device and position data
        let status = 'unknown';
        if (position) {
          const lastUpdate = position.gpsdatetime || position.lastupdate;
          if (lastUpdate) {
            const timeDiff = Date.now() - new Date(lastUpdate).getTime();
            const hoursOld = timeDiff / (1000 * 60 * 60);
            if (hoursOld < 1) {
              status = position.speed > 5 ? 'moving' : 'idle';
            } else {
              status = 'offline';
            }
          }
        }

        return {
          gp51_device_id: deviceId,
          name: device.devicename || device.name || `Device ${deviceId}`,
          status: status,
          is_active: device.isenabled !== false,
          last_position: position ? {
            latitude: position.latitude || position.lat,
            longitude: position.longitude || position.lng,
            speed: position.speed || 0,
            course: position.course || position.direction || 0,
            timestamp: position.gpsdatetime || position.lastupdate || new Date().toISOString()
          } : null,
          gp51_metadata: {
            device: device,
            position: position || null,
            sync_timestamp: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        };
      });

      // Perform upsert operation
      const { data: upsertedVehicles, error: upsertError } = await supabase
        .from('vehicles')
        .upsert(vehiclesToUpsert, { 
          onConflict: 'gp51_device_id',
          ignoreDuplicates: false 
        })
        .select('id, gp51_device_id, name, status');

      if (upsertError) {
        console.error("❌ Supabase upsert error:", upsertError);
        return errorResponse(
          "Failed to persist vehicle data to database",
          500,
          upsertError.message,
          "DB_ERROR"
        );
      }

      console.log(`✅ Successfully synchronized ${upsertedVehicles?.length || 0} vehicles to database`);

      // 6. Return comprehensive success response
      const responseData = {
        success: true,
        data: {
          devices_fetched: devices.length,
          positions_fetched: positions.length,
          vehicles_synchronized: upsertedVehicles?.length || 0,
          vehicles: upsertedVehicles,
          sync_timestamp: new Date().toISOString()
        },
        message: `Successfully synchronized ${upsertedVehicles?.length || 0} vehicles`
      };

      return jsonResponse(responseData);
    } else {
      // No devices found but operation was successful
      return jsonResponse({
        success: true,
        data: {
          devices_fetched: 0,
          positions_fetched: 0,
          vehicles_synchronized: 0,
          sync_timestamp: new Date().toISOString()
        },
        message: "No devices found in GP51 account"
      });
    }
    
  } catch (err) {
    console.error("💥 Unexpected error in gp51-live-import:", err);
    return errorResponse(
      "Internal error during GP51 data synchronization", 
      500, 
      err instanceof Error ? err.message : 'Unknown error',
      "INTERNAL_ERROR"
    );
  }
});
