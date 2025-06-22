
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getValidGp51Session } from "../_shared/gp51_session_utils.ts";
import { gp51ApiClient, GP51DeviceInfo } from "../_shared/gp51_api_client_unified.ts";
import { createSuccessResponse, createErrorResponse, calculateLatency } from "../_shared/response_utils.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";

interface SyncResult {
  success: boolean;
  message: string;
  totalDevices: number;
  successfulSyncs: number;
  failedSyncs: number;
  newDevices: number;
  updatedDevices: number;
  errorLog: string[];
  latency: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('🚀 [SyncGP51Vehicles] Starting enhanced GP51 vehicle synchronization...');

    // Get valid GP51 session using existing authentication system
    const { session, errorResponse } = await getValidGp51Session();
    if (errorResponse) {
      return errorResponse;
    }

    if (!session) {
      return createErrorResponse(
        'No valid GP51 session found',
        'Please configure GP51 credentials',
        401,
        calculateLatency(startTime)
      );
    }

    console.log(`🔑 Using authenticated session for user: ${session.envio_user_id}`);
    console.log(`👤 GP51 Username: ${session.username}`);

    const supabase = getSupabaseClient();

    // Log sync start
    const { data: syncStatus, error: syncInsertError } = await supabase
      .from('gp51_sync_status')
      .insert({
        sync_type: 'enhanced_vehicle_sync',
        status: 'running',
        sync_details: {
          user_id: session.envio_user_id,
          username: session.username,
          started_by: 'sync_function'
        }
      })
      .select()
      .single();

    if (syncInsertError) {
      console.error('❌ Failed to log sync start:', syncInsertError);
    }

    const syncId = syncStatus?.id;

    // Get complete device and position data using enhanced API client
    console.log('📡 Fetching complete device and position data from GP51...');
    
    let devicesData: { devices: GP51DeviceInfo[], positions: GP51DeviceInfo[] };
    
    try {
      devicesData = await gp51ApiClient.getDevicesWithPositions(
        session.gp51_token,
        session.username
      );
    } catch (error) {
      console.error('❌ Failed to fetch devices and positions:', error);
      
      // Update sync status
      if (syncId) {
        await supabase
          .from('gp51_sync_status')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_log: [{ error: error.message, timestamp: new Date().toISOString() }]
          })
          .eq('id', syncId);
      }

      return createErrorResponse(
        'Failed to fetch devices from GP51',
        error instanceof Error ? error.message : 'Unknown error',
        500,
        calculateLatency(startTime)
      );
    }

    const { devices, positions } = devicesData;
    console.log(`📊 Processing ${devices.length} devices and ${positions.length} positions`);

    if (devices.length === 0) {
      console.log('ℹ️ No devices found in GP51 account');
      
      // Update sync status
      if (syncId) {
        await supabase
          .from('gp51_sync_status')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            total_devices: 0
          })
          .eq('id', syncId);
      }

      return createSuccessResponse({
        success: true,
        message: 'No devices found in GP51 account',
        totalDevices: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        newDevices: 0,
        updatedDevices: 0,
        errorLog: []
      }, calculateLatency(startTime));
    }

    // Create a map of positions by device ID for efficient lookup
    const positionMap = new Map<string, GP51DeviceInfo>();
    positions.forEach(pos => {
      if (pos.deviceid) {
        positionMap.set(pos.deviceid, pos);
      }
    });

    // Process each device
    let successfulSyncs = 0;
    let failedSyncs = 0;
    let newDevices = 0;
    let updatedDevices = 0;
    const errorLog: string[] = [];

    for (const device of devices) {
      try {
        const position = positionMap.get(device.deviceid);
        
        // Prepare vehicle data with enhanced metadata
        const vehicleData = {
          gp51_device_id: device.deviceid,
          name: device.devicename || device.deviceid,
          device_name: device.devicename,
          device_type: device.devicetype,
          sim_number: device.simnum,
          login_name: device.loginname,
          gp51_group_id: device.groupid,
          is_free: device.isfree || false,
          allow_edit: device.allowedit !== false,
          icon: device.icon,
          starred: device.starred || false,
          total_distance: device.totaldistance || 0,
          total_oil: device.totaloil || 0,
          last_active_time: device.lastactivetime ? new Date(device.lastactivetime).toISOString() : null,
          expire_notify_time: device.expirenotifytime ? new Date(device.expirenotifytime).toISOString() : null,
          user_id: session.envio_user_id,
          last_sync_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Add position data if available
        if (position) {
          vehicleData.last_position = {
            lat: position.callat,
            lon: position.callon,
            speed: position.speed,
            course: position.course,
            timestamp: position.updatetime || position.devicetime,
            status_text: position.strstatusen || position.strstatus,
            altitude: position.altitude
          };
          
          vehicleData.altitude = position.altitude;
          vehicleData.course = position.course;
          vehicleData.device_time = position.devicetime ? new Date(position.devicetime).toISOString() : null;
          vehicleData.arrived_time = position.arrivedtime ? new Date(position.arrivedtime).toISOString() : null;
          vehicleData.valid_position_time = position.validpositiontime ? new Date(position.validpositiontime).toISOString() : null;
          vehicleData.gp51_status = position.status;
          vehicleData.gp51_status_text = position.strstatusen || position.strstatus;
          vehicleData.gp51_alarm = position.alarm;
        }

        // Check if vehicle exists
        const { data: existingVehicle } = await supabase
          .from('vehicles')
          .select('id')
          .eq('gp51_device_id', device.deviceid)
          .eq('user_id', session.envio_user_id)
          .single();

        if (existingVehicle) {
          // Update existing vehicle
          const { error: updateError } = await supabase
            .from('vehicles')
            .update(vehicleData)
            .eq('id', existingVehicle.id);

          if (updateError) {
            console.error(`❌ Failed to update vehicle ${device.deviceid}:`, updateError);
            errorLog.push(`Update failed for ${device.deviceid}: ${updateError.message}`);
            failedSyncs++;
          } else {
            console.log(`✅ Updated vehicle: ${device.deviceid}`);
            updatedDevices++;
            successfulSyncs++;
          }
        } else {
          // Insert new vehicle
          const { error: insertError } = await supabase
            .from('vehicles')
            .insert(vehicleData);

          if (insertError) {
            console.error(`❌ Failed to insert vehicle ${device.deviceid}:`, insertError);
            errorLog.push(`Insert failed for ${device.deviceid}: ${insertError.message}`);
            failedSyncs++;
          } else {
            console.log(`✅ Inserted new vehicle: ${device.deviceid}`);
            newDevices++;
            successfulSyncs++;
          }
        }

      } catch (error) {
        console.error(`❌ Error processing device ${device.deviceid}:`, error);
        errorLog.push(`Processing error for ${device.deviceid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failedSyncs++;
      }
    }

    const syncResult: SyncResult = {
      success: failedSyncs === 0,
      message: `Sync completed: ${successfulSyncs} successful, ${failedSyncs} failed`,
      totalDevices: devices.length,
      successfulSyncs,
      failedSyncs,
      newDevices,
      updatedDevices,
      errorLog,
      latency: calculateLatency(startTime)
    };

    // Update sync status
    if (syncId) {
      await supabase
        .from('gp51_sync_status')
        .update({
          status: syncResult.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          total_devices: devices.length,
          successful_syncs: successfulSyncs,
          failed_syncs: failedSyncs,
          error_log: errorLog.map(err => ({ error: err, timestamp: new Date().toISOString() })),
          sync_details: {
            ...syncStatus?.sync_details,
            new_devices: newDevices,
            updated_devices: updatedDevices,
            positions_processed: positions.length
          }
        })
        .eq('id', syncId);
    }

    console.log(`🏁 Enhanced GP51 vehicle sync completed: ${syncResult.message}`);

    return createSuccessResponse(syncResult, syncResult.latency);

  } catch (error) {
    console.error('❌ Unexpected error in syncGp51Vehicles:', error);
    return createErrorResponse(
      'Internal server error during GP51 vehicle sync',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
});
