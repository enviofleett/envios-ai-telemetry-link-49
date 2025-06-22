
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getValidGp51Session } from "../_shared/gp51_session_utils.ts";
import { gp51ApiClient } from "../_shared/gp51_api_client_unified.ts";
import { createSuccessResponse, createErrorResponse, calculateLatency } from "../_shared/response_utils.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('🚀 [fetchLiveGp51Data] Starting GP51 live data fetch...');
    console.log(`🌐 [fetchLiveGp51Data] Environment check - GP51_GLOBAL_API_TOKEN: ${Deno.env.get('GP51_GLOBAL_API_TOKEN') ? 'SET' : 'NOT SET'}`);

    // Get valid GP51 session
    const { session, errorResponse } = await getValidGp51Session();
    if (errorResponse) {
      console.error('❌ [fetchLiveGp51Data] No valid session found');
      return errorResponse;
    }

    if (!session) {
      console.error('❌ [fetchLiveGp51Data] Session is null');
      return createErrorResponse(
        'No valid GP51 session found',
        'Please configure GP51 credentials in admin settings',
        401,
        calculateLatency(startTime)
      );
    }

    console.log(`🔑 [fetchLiveGp51Data] Using session:`);
    console.log(`  - Token: ${session.gp51_token.substring(0, 8)}...`);
    console.log(`  - Username: ${session.username}`);
    console.log(`  - User ID: ${session.envio_user_id}`);
    console.log(`  - Expires: ${session.token_expires_at}`);

    // Get all devices from GP51 using queryMonitorList
    console.log('📱 [fetchLiveGp51Data] Fetching all devices from GP51...');
    
    let devicesResponse;
    try {
      devicesResponse = await gp51ApiClient.queryMonitorList(session.gp51_token, session.username);
    } catch (error) {
      console.error('❌ [fetchLiveGp51Data] Failed to fetch devices:', error);
      return createErrorResponse(
        'Failed to fetch devices from GP51',
        error instanceof Error ? error.message : 'Unknown error',
        500,
        calculateLatency(startTime)
      );
    }

    if (devicesResponse.status !== 0 || !devicesResponse.groups) {
      console.error('❌ [fetchLiveGp51Data] Invalid devices response:', devicesResponse);
      return createErrorResponse(
        'Failed to fetch devices from GP51',
        devicesResponse.cause || 'Invalid response format',
        500,
        calculateLatency(startTime)
      );
    }

    // Extract devices from groups structure
    const allDevices = [];
    for (const group of devicesResponse.groups) {
      if (group.devices && Array.isArray(group.devices)) {
        allDevices.push(...group.devices);
      }
    }

    console.log(`📊 [fetchLiveGp51Data] Found ${allDevices.length} devices across ${devicesResponse.groups.length} groups`);

    if (allDevices.length === 0) {
      console.log('ℹ️ [fetchLiveGp51Data] No devices found in GP51 account');
      return createSuccessResponse({
        message: 'No devices found in GP51 account',
        total_devices: 0,
        total_positions: 0,
        devices_processed: 0,
        batches_processed: 0,
        user_id: session.envio_user_id
      }, calculateLatency(startTime));
    }

    // Process devices in batches
    const BATCH_SIZE = 50;
    const deviceIds = allDevices.map(d => d.deviceid || d.id).filter(id => id);
    const batches = [];
    
    for (let i = 0; i < deviceIds.length; i += BATCH_SIZE) {
      batches.push(deviceIds.slice(i, i + BATCH_SIZE));
    }

    console.log(`🔄 [fetchLiveGp51Data] Processing ${deviceIds.length} devices in ${batches.length} batches of max ${BATCH_SIZE}`);

    let allPositions: any[] = [];
    let batchIndex = 0;
    let successfulBatches = 0;

    for (const batch of batches) {
      batchIndex++;
      console.log(`🔄 [fetchLiveGp51Data] Processing batch ${batchIndex}/${batches.length} with ${batch.length} devices...`);
      
      try {
        const positionsResponse = await gp51ApiClient.getLastPosition(
          session.gp51_token,
          batch
        );
        
        if (positionsResponse.status === 0 && positionsResponse.records) {
          const batchPositions = Array.isArray(positionsResponse.records) ? positionsResponse.records : [positionsResponse.records];
          allPositions = allPositions.concat(batchPositions);
          successfulBatches++;
          console.log(`✅ [fetchLiveGp51Data] Batch ${batchIndex} completed: ${batchPositions.length} positions retrieved`);
        } else {
          console.warn(`⚠️ [fetchLiveGp51Data] Batch ${batchIndex} failed: ${positionsResponse.cause || 'Unknown error'}`);
        }

        // Add delay between batches to avoid overwhelming the GP51 API
        if (batchIndex < batches.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ [fetchLiveGp51Data] Error processing batch ${batchIndex}:`, error);
      }
    }

    console.log(`📊 [fetchLiveGp51Data] Total positions collected: ${allPositions.length} from ${successfulBatches}/${batches.length} successful batches`);

    // Process and persist the vehicle position data
    if (allPositions.length > 0) {
      console.log('🔧 [fetchLiveGp51Data] Processing positions for persistence...');
      
      const supabase = getSupabaseClient();
      const vehicleData = allPositions.map(position => ({
        gp51_device_id: position.deviceid,
        name: position.deviceid, // Use device ID as name, can be updated later
        user_id: session.envio_user_id,
        last_position: {
          lat: position.callat,
          lon: position.callon,
          speed: position.speed,
          course: position.course,
          timestamp: position.updatetime,
          status_text: position.strstatusen || position.strstatus,
          altitude: position.altitude,
          radius: position.radius,
          total_distance: position.totaldistance,
          device_time: position.devicetime,
          arrived_time: position.arrivedtime,
          valid_position_time: position.validpoistiontime,
          moving: position.moving,
          park_duration: position.parkduration
        },
        updated_at: new Date().toISOString()
      }));

      console.log(`🔧 [fetchLiveGp51Data] Prepared ${vehicleData.length} vehicle records for upsert`);

      // Batch upsert vehicles
      const { data: upsertedVehicles, error: upsertError } = await supabase
        .from('vehicles')
        .upsert(vehicleData, { 
          onConflict: 'gp51_device_id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error('❌ [fetchLiveGp51Data] Error upserting vehicles:', upsertError);
        return createErrorResponse(
          'Failed to save vehicle data',
          upsertError.message,
          500,
          calculateLatency(startTime)
        );
      }

      console.log(`✅ [fetchLiveGp51Data] Successfully upserted ${vehicleData.length} vehicles`);
    }

    const responseData = {
      message: 'GP51 live data fetch completed successfully',
      total_devices: allDevices.length,
      total_positions: allPositions.length,
      devices_processed: deviceIds.length,
      batches_processed: batches.length,
      successful_batches: successfulBatches,
      user_id: session.envio_user_id,
      processing_time_ms: calculateLatency(startTime)
    };

    console.log('🏁 [fetchLiveGp51Data] GP51 live data fetch completed successfully');
    console.log(`📊 [fetchLiveGp51Data] Final stats:`, responseData);

    return createSuccessResponse(responseData, calculateLatency(startTime));

  } catch (error) {
    console.error('❌ [fetchLiveGp51Data] Unexpected error:', error);
    return createErrorResponse(
      'Internal server error during GP51 data fetch',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
});
