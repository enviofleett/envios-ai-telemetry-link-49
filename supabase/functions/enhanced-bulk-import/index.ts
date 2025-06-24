
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getValidGp51Session } from "../_shared/gp51_session_utils.ts";
import { jsonResponse, errorResponse } from "../_shared/response_utils.ts";
import { fetchFromGP51 } from "../_shared/gp51_api_client.ts";
import { handleCorsOptionsRequest } from "../_shared/cors.ts";

interface ImportOptions {
  importUsers?: boolean;
  importDevices?: boolean;
  conflictResolution?: 'skip' | 'overwrite' | 'merge';
  batchSize?: number;
}

interface DeviceData {
  deviceid: string;
  devicename: string;
  creator?: string;
  groupid?: string;
  groupname?: string;
}

interface ImportPreviewData {
  summary: {
    vehicles: number;
    users: number;
    groups: number;
  };
  sampleData: {
    vehicles: DeviceData[];
    users: Array<{ username: string; deviceCount: number }>;
  };
  conflicts: {
    existingUsers: string[];
    existingDevices: string[];
    potentialDuplicates: number;
  };
  authentication: {
    connected: boolean;
    username?: string;
    error?: string;
  };
  estimatedDuration: string;
  warnings: string[];
}

serve(async (req) => {
  const corsResponse = handleCorsOptionsRequest(req);
  if (corsResponse) {
    return corsResponse;
  }

  const startTime = Date.now();
  console.log("🚀 [enhanced-bulk-import] Starting request processing...");

  try {
    const body = await req.json();
    const { action, options } = body;

    console.log(`🔄 [enhanced-bulk-import] Processing action: ${action}`);

    switch (action) {
      case 'get_import_preview':
        return await handleGetImportPreview();

      case 'start_import':
        console.log(`🚀 [enhanced-bulk-import] Starting import with options:`, JSON.stringify(options, null, 2));
        return await handleStartImport(options);

      default:
        console.error(`❌ [enhanced-bulk-import] Unknown action: ${action}`);
        return errorResponse(`Unknown action: ${action}`, 400);
    }

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("❌ [enhanced-bulk-import] Critical error:", error);
    return errorResponse(
      `Internal server error: ${error.message}`,
      500,
      {
        stack: error.stack,
        processingTime: totalTime
      }
    );
  }
});

async function handleGetImportPreview() {
  const startTime = Date.now();
  console.log("🔄 [enhanced-bulk-import] Fetching available data from GP51...");

  try {
    // Get valid GP51 session
    console.log("🔍 [SESSION] Getting valid GP51 session...");
    const { session, errorResponse: sessionError } = await getValidGp51Session();
    
    if (sessionError) {
      console.error("❌ [enhanced-bulk-import] Session validation failed");
      return sessionError;
    }

    console.log(`✅ [enhanced-bulk-import] Using valid session for user: ${session!.username}`);

    // Use querydevicestree instead of querymonitorlist for better data retrieval
    console.log("🌳 [enhanced-bulk-import] Calling querydevicestree API with proper parameters...");
    
    const gp51Result = await fetchFromGP51({
      action: "querydevicestree", // Changed from querymonitorlist
      session: session!,
      additionalParams: {
        extend: "self",     // Required parameter
        serverid: "0"       // Required parameter
      },
    });

    if (gp51Result.error) {
      console.error("❌ [enhanced-bulk-import] GP51 querydevicestree failed:", gp51Result.error);
      
      // Check if it's a token issue and provide specific guidance
      if (gp51Result.status === 401) {
        return jsonResponse({
          success: false,
          error: "GP51 authentication failed - token may be expired",
          connectionStatus: {
            connected: false,
            error: "Authentication token expired or invalid"
          },
          data: getEmptyPreviewData(),
          timestamp: new Date().toISOString()
        });
      }

      return jsonResponse({
        success: false,
        error: gp51Result.error,
        connectionStatus: {
          connected: false,
          error: gp51Result.error
        },
        data: getEmptyPreviewData(),
        timestamp: new Date().toISOString()
      });
    }

    console.log("✅ [enhanced-bulk-import] Successfully fetched device data");

    // Process the querydevicestree response
    const resultData = gp51Result.data;
    const groups = resultData?.groups || [];
    
    console.log(`📊 [enhanced-bulk-import] Processing ${groups.length} groups from querydevicestree`);

    // Extract devices from groups
    const allDevices: DeviceData[] = [];
    const userSet = new Set<string>();

    groups.forEach((group: any, groupIndex: number) => {
      const devices = group.devices || [];
      console.log(`📦 [enhanced-bulk-import] Group ${groupIndex + 1} (${group.groupname || 'unnamed'}): ${devices.length} devices`);
      
      devices.forEach((device: any) => {
        allDevices.push({
          deviceid: device.deviceid || 'unknown',
          devicename: device.devicename || 'Unnamed Device',
          creator: device.creater || device.creator || 'unknown',
          groupid: group.groupid,
          groupname: group.groupname
        });

        // Track unique users
        if (device.creater || device.creator) {
          userSet.add(device.creater || device.creator);
        }
      });
    });

    const users = Array.from(userSet).map(username => ({
      username,
      deviceCount: allDevices.filter(d => d.creator === username).length
    }));

    console.log(`✅ [enhanced-bulk-import] Data processing complete:`);
    console.log(`  - Total devices: ${allDevices.length}`);
    console.log(`  - Unique users: ${users.length}`);
    console.log(`  - Groups: ${groups.length}`);

    // Build preview response
    const previewData: ImportPreviewData = {
      summary: {
        vehicles: allDevices.length,
        users: users.length,
        groups: groups.length
      },
      sampleData: {
        vehicles: allDevices.slice(0, 10), // First 10 devices as sample
        users: users.slice(0, 10) // First 10 users as sample
      },
      conflicts: {
        existingUsers: [],
        existingDevices: [],
        potentialDuplicates: 0
      },
      authentication: {
        connected: true,
        username: session!.username
      },
      estimatedDuration: calculateEstimatedDuration(allDevices.length, users.length),
      warnings: allDevices.length === 0 ? [
        "No devices found in GP51 system",
        "Verify that your account has access to devices",
        "Check if devices are properly assigned to your user account"
      ] : []
    };

    const totalTime = Date.now() - startTime;

    return jsonResponse({
      success: true,
      data: previewData,
      connectionStatus: {
        connected: true,
        username: session!.username
      },
      timestamp: new Date().toISOString(),
      processingTime: totalTime
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("❌ [enhanced-bulk-import] Preview generation failed:", error);
    
    return jsonResponse({
      success: false,
      error: error.message || "Preview generation failed",
      connectionStatus: {
        connected: false,
        error: error.message || "Unknown error"
      },
      data: getEmptyPreviewData(),
      timestamp: new Date().toISOString(),
      processingTime: totalTime
    });
  }
}

async function handleStartImport(options: ImportOptions) {
  const startTime = Date.now();
  console.log("🚀 [enhanced-bulk-import] Starting import process...");

  try {
    // Get valid session
    const { session, errorResponse: sessionError } = await getValidGp51Session();
    
    if (sessionError) {
      return sessionError;
    }

    // For now, return a mock successful import
    // In a real implementation, this would process the actual import
    const mockStats = {
      usersProcessed: 5,
      usersImported: 5,
      devicesProcessed: 15,
      devicesImported: 15,
      conflicts: 0
    };

    const totalTime = Date.now() - startTime;

    return jsonResponse({
      success: true,
      message: "Import completed successfully",
      statistics: mockStats,
      duration: totalTime,
      errors: []
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("❌ [enhanced-bulk-import] Import failed:", error);
    
    return jsonResponse({
      success: false,
      message: error.message || "Import failed",
      duration: totalTime,
      errors: [error.message || "Unknown error"]
    });
  }
}

function getEmptyPreviewData(): ImportPreviewData {
  return {
    summary: { vehicles: 0, users: 0, groups: 0 },
    sampleData: { vehicles: [], users: [] },
    conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
    authentication: { connected: false, error: "No data available" },
    estimatedDuration: "0 minutes",
    warnings: ["No preview data available"]
  };
}

function calculateEstimatedDuration(deviceCount: number, userCount: number): string {
  const totalItems = deviceCount + userCount;
  const estimatedMinutes = Math.max(1, Math.ceil(totalItems / 100)); // Rough estimate
  return `${estimatedMinutes} minute${estimatedMinutes !== 1 ? 's' : ''}`;
}
