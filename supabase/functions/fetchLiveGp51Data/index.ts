
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { jsonResponse, errorResponse } from "../_shared/response_utils.ts";
import { getValidGp51Session } from "../_shared/gp51_session_utils.ts";
import { fetchFromGP51 } from "../_shared/gp51_api_client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Starting GP51 live data fetch operation...");
    
    // Get valid GP51 session using shared utility
    const { session, errorResponse: sessionError } = await getValidGp51Session();
    
    if (sessionError) {
      console.error("❌ Session validation failed");
      return sessionError;
    }

    if (!session) {
      console.error("❌ No valid session available");
      return errorResponse("No valid GP51 session available", 401);
    }

    console.log(`✅ Found GP51 session for user: ${session.username}`);

    // Parse request body for force sync option
    const body = await req.json().catch(() => ({}));
    const forceFullSync = body.forceFullSync || false;
    
    console.log(`🔄 Starting ${forceFullSync ? 'full sync' : 'incremental sync'} with GP51...`);

    // Make request to GP51 API using shared utility
    console.log(`📡 Making GP51 API request for querymonitorlist`);
    console.log(`📝 Request parameters: action=querymonitorlist, username=${session.username}`);

    const gp51Result = await fetchFromGP51({
      action: 'querymonitorlist',
      session: session,
      additionalParams: {
        username: session.username
      }
    });

    if (gp51Result.error) {
      console.error(`❌ GP51 API request failed: ${gp51Result.error}`);
      return errorResponse(
        `GP51 API request failed: ${gp51Result.error}`, 
        gp51Result.status || 500
      );
    }

    const gp51Data = gp51Result.data;
    console.log("📊 GP51 API response received:", {
      hasGroups: !!gp51Data.groups,
      groupCount: gp51Data.groups?.length || 0
    });

    // Extract devices and positions from response
    const devices = gp51Data.groups?.flatMap((group: any) => group.devices || []) || [];
    const positions = devices.flatMap((device: any) => device.positions || []);

    console.log(`📈 Data summary: ${devices.length} devices, ${positions.length} positions`);

    // Determine sync type based on data volume and force flag
    const syncType = forceFullSync || devices.length > 100 ? 'fullSync' : 'batchedUpdate';
    
    const responseData = {
      type: syncType,
      devices: syncType === 'fullSync' ? devices : undefined,
      positions: positions,
      statistics: {
        totalDevices: devices.length,
        totalPositions: positions.length,
        responseTime: Date.now()
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'gp51-api',
        syncType: syncType,
        sessionUsername: session.username
      }
    };

    console.log(`✅ Successfully processed ${syncType} - returning data`);

    return jsonResponse({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("💥 Critical error in fetchLiveGp51Data:", error);
    return errorResponse(
      `Internal server error: ${error.message}`, 
      500, 
      error.stack
    );
  }
});
