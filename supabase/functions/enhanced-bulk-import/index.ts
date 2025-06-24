
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getValidGp51Session, monitorSessionHealth } from "../_shared/gp51_session_utils.ts";
import { jsonResponse, errorResponse } from "../_shared/response_utils.ts";
import { fetchFromGP51 } from "../_shared/gp51_api_client.ts";
import { handleCorsOptionsRequest } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCorsOptionsRequest(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const { action } = await req.json();
    console.log(`🔄 [enhanced-bulk-import] Processing action: ${action}`);

    // Handle session health monitoring
    if (action === 'monitor_session_health') {
      console.log('📊 [enhanced-bulk-import] Monitoring session health...');
      const healthReport = await monitorSessionHealth();
      return jsonResponse({
        success: true,
        health: healthReport,
        recommendations: generateHealthRecommendations(healthReport)
      });
    }

    // Get and validate GP51 session with automatic re-authentication
    const { session, errorResponse: sessionError } = await getValidGp51Session();
    if (sessionError) {
      console.error("❌ [enhanced-bulk-import] Session validation failed");
      return sessionError;
    }

    if (!session) {
      return errorResponse("No valid GP51 session found", 401);
    }

    console.log(`✅ [enhanced-bulk-import] Using valid session for user: ${session.username}`);

    switch (action) {
      case 'fetch_available_data':
        return await handleFetchAvailableData(session);
      
      case 'start_import':
        return await handleStartImport(session);
      
      case 'get_import_status':
        return await handleGetImportStatus();
      
      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }

  } catch (error) {
    console.error("❌ [enhanced-bulk-import] Critical error:", error);
    return errorResponse(
      `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
});

function generateHealthRecommendations(health: any): string[] {
  const recommendations: string[] = [];
  
  if (health.invalidTokens > 0) {
    recommendations.push(`${health.invalidTokens} sessions have invalid tokens and need re-authentication`);
  }
  
  if (health.expiredSessions > 0) {
    recommendations.push(`${health.expiredSessions} sessions are expired and will be automatically refreshed`);
  }
  
  if (health.validSessions === 0 && health.totalSessions > 0) {
    recommendations.push('No valid sessions found. Please check GP51 credentials and re-authenticate');
  }
  
  if (health.totalSessions === 0) {
    recommendations.push('No GP51 sessions configured. Please authenticate with GP51 first');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All sessions are healthy');
  }
  
  return recommendations;
}

async function handleFetchAvailableData(session: any) {
  console.log('🔄 [enhanced-bulk-import] Fetching available data from GP51...');
  
  try {
    // Fetch device/monitor list using the corrected API
    const deviceListResult = await fetchFromGP51({
      action: "querymonitorlist",
      session: session,
      additionalParams: {
        username: session.username,
      },
    });

    if (deviceListResult.error) {
      console.error("❌ [enhanced-bulk-import] Failed to fetch device list:", deviceListResult);
      return errorResponse(
        `GP51 API error: ${deviceListResult.error}`,
        deviceListResult.status || 400
      );
    }

    console.log('✅ [enhanced-bulk-import] Successfully fetched device data');
    
    // Process and structure the response data
    const deviceData = deviceListResult.data;
    const devices = deviceData?.groups?.flatMap((g: any) => g.devices || []) || [];
    
    // Calculate import preview statistics
    const importPreview = {
      totalDevices: devices.length,
      totalGroups: deviceData?.groups?.length || 0,
      devicesByGroup: deviceData?.groups?.map((g: any) => ({
        groupName: g.groupname || 'Unknown Group',
        deviceCount: g.devices?.length || 0,
        devices: g.devices?.map((d: any) => ({
          deviceId: d.deviceid,
          deviceName: d.devicename || d.deviceid,
          lastUpdate: d.lastupdate
        })) || []
      })) || [],
      estimatedImportTime: Math.ceil(devices.length / 10), // Rough estimate: 10 devices per minute
      lastFetched: new Date().toISOString()
    };

    return jsonResponse({
      success: true,
      preview: importPreview,
      rawData: deviceData,
      session: {
        username: session.username,
        expiresAt: session.token_expires_at,
        lastValidated: session.last_validated_at
      }
    });

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Error fetching available data:', error);
    return errorResponse(
      `Failed to fetch available data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}

async function handleStartImport(session: any) {
  console.log('🔄 [enhanced-bulk-import] Starting bulk import process...');
  
  // This would implement the actual import logic
  // For now, return a placeholder response
  return jsonResponse({
    success: true,
    message: 'Import process started',
    importId: crypto.randomUUID(),
    status: 'in_progress'
  });
}

async function handleGetImportStatus() {
  console.log('📊 [enhanced-bulk-import] Getting import status...');
  
  // This would check the status of ongoing imports
  // For now, return a placeholder response
  return jsonResponse({
    success: true,
    imports: [],
    activeImports: 0
  });
}
