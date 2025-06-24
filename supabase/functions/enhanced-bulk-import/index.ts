
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { getValidGp51Session } from '../_shared/gp51_session_utils.ts';
import { gp51ApiClient } from '../_shared/gp51_api_client_unified.ts';
import { createSuccessResponse, createErrorResponse, calculateLatency } from '../_shared/response_utils.ts';

// Standardized interfaces for GP51 responses
interface GP51ImportPreview {
  summary: {
    vehicles: number;
    users: number;
    groups: number;
  };
  sampleData: {
    vehicles: any[];
    users: any[];
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

interface GP51ImportResult {
  success: boolean;
  statistics: {
    usersProcessed: number;
    usersImported: number;
    devicesProcessed: number;
    devicesImported: number;
    conflicts: number;
  };
  message: string;
  errors: string[];
  duration: number;
}

serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 [enhanced-bulk-import] Starting request processing...');

    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ [enhanced-bulk-import] Failed to parse request body:', parseError);
      return createErrorResponse(
        'Invalid request body',
        'Request body must be valid JSON',
        400,
        calculateLatency(startTime)
      );
    }

    const { action, options } = body;
    console.log(`🔄 [enhanced-bulk-import] Processing action: ${action}`);

    // Get valid GP51 session
    const { session, errorResponse } = await getValidGp51Session();
    if (errorResponse) {
      console.error('❌ [enhanced-bulk-import] Session validation failed');
      return errorResponse;
    }

    if (!session) {
      console.error('❌ [enhanced-bulk-import] No valid session found');
      return createErrorResponse(
        'No valid GP51 session found',
        'Please configure GP51 credentials',
        401,
        calculateLatency(startTime)
      );
    }

    console.log(`✅ [enhanced-bulk-import] Using valid session for user: ${session.username}`);

    switch (action) {
      case 'get_import_preview':
        return await handleGetImportPreview(session, startTime);
      
      case 'start_import':
        return await handleStartImport(session, options || {}, startTime);
      
      default:
        console.warn(`❌ [enhanced-bulk-import] Unknown action: ${action}`);
        return createErrorResponse(
          `Unknown action: ${action}`,
          'Supported actions: get_import_preview, start_import',
          400,
          calculateLatency(startTime)
        );
    }

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Unexpected error:', error);
    return createErrorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error occurred',
      500,
      calculateLatency(startTime)
    );
  }
});

async function handleGetImportPreview(session: any, startTime: number): Promise<Response> {
  try {
    console.log('🔄 [enhanced-bulk-import] Fetching available data from GP51...');

    // Fetch device/vehicle data from GP51
    const devicesResponse = await gp51ApiClient.queryMonitorList(session.gp51_token, session.username);
    
    if (devicesResponse.status !== 0) {
      console.error('❌ [enhanced-bulk-import] Failed to fetch device data:', devicesResponse.cause);
      
      const failedPreview: GP51ImportPreview = {
        summary: { vehicles: 0, users: 0, groups: 0 },
        sampleData: { vehicles: [], users: [] },
        conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
        authentication: { 
          connected: false, 
          error: devicesResponse.cause || 'Failed to connect to GP51' 
        },
        estimatedDuration: '0 minutes',
        warnings: ['Failed to fetch data from GP51', devicesResponse.cause || 'Unknown error'].filter(Boolean)
      };

      return createSuccessResponse({
        success: false,
        error: devicesResponse.cause || 'Failed to fetch GP51 data',
        ...failedPreview
      }, calculateLatency(startTime));
    }

    console.log('✅ [enhanced-bulk-import] Successfully fetched device data');

    // Parse and validate the response
    const devices = Array.isArray(devicesResponse.records) ? devicesResponse.records : [];
    const groups = Array.isArray(devicesResponse.groups) ? devicesResponse.groups : [];
    
    console.log(`📊 [enhanced-bulk-import] Found ${devices.length} devices and ${groups.length} groups`);

    // Extract unique users from device data
    const uniqueUsers = new Set();
    devices.forEach((device: any) => {
      if (device.creater) {
        uniqueUsers.add(device.creater);
      }
    });

    // Create sample data (first 5 items for preview)
    const sampleVehicles = devices.slice(0, 5).map((device: any) => ({
      deviceId: device.deviceid || device.id || 'unknown',
      deviceName: device.devicename || device.name || 'Unnamed Device',
      creator: device.creater || 'unknown',
      lastActive: device.lastactivetime ? new Date(device.lastactivetime * 1000).toISOString() : null,
      status: device.isfree ? 'inactive' : 'active'
    }));

    const sampleUsers = Array.from(uniqueUsers).slice(0, 5).map(username => ({
      username,
      hasDevices: true
    }));

    // Estimate import duration
    const totalItems = devices.length + uniqueUsers.size;
    const estimatedMinutes = Math.ceil(totalItems / 100); // Conservative estimate: 100 items per minute
    const estimatedDuration = estimatedMinutes < 1 ? '< 1 minute' : 
                            estimatedMinutes === 1 ? '1 minute' : 
                            estimatedMinutes < 60 ? `${estimatedMinutes} minutes` : 
                            `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`;

    // Build successful preview response
    const successfulPreview: GP51ImportPreview = {
      summary: {
        vehicles: devices.length,
        users: uniqueUsers.size,
        groups: groups.length
      },
      sampleData: {
        vehicles: sampleVehicles,
        users: sampleUsers
      },
      conflicts: {
        existingUsers: [], // Would need database check to populate
        existingDevices: [], // Would need database check to populate
        potentialDuplicates: 0
      },
      authentication: {
        connected: true,
        username: session.username
      },
      estimatedDuration,
      warnings: devices.length === 0 ? ['No vehicles found in GP51 account'] : []
    };

    console.log('✅ [enhanced-bulk-import] Preview generated successfully');

    return createSuccessResponse({
      success: true,
      data: successfulPreview,
      connectionStatus: { connected: true, username: session.username },
      timestamp: new Date().toISOString()
    }, calculateLatency(startTime));

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Preview generation failed:', error);
    
    const errorPreview: GP51ImportPreview = {
      summary: { vehicles: 0, users: 0, groups: 0 },
      sampleData: { vehicles: [], users: [] },
      conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
      authentication: { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      estimatedDuration: '0 minutes',
      warnings: ['Failed to generate preview', error instanceof Error ? error.message : 'Unknown error']
    };

    return createSuccessResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Preview generation failed',
      data: errorPreview,
      connectionStatus: { connected: false, error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    }, calculateLatency(startTime));
  }
}

async function handleStartImport(session: any, options: any, startTime: number): Promise<Response> {
  try {
    console.log('🚀 [enhanced-bulk-import] Starting import process...');
    console.log('📋 [enhanced-bulk-import] Import options:', options);

    // For now, return a placeholder response since full import logic would be complex
    const importResult: GP51ImportResult = {
      success: true,
      statistics: {
        usersProcessed: 0,
        usersImported: 0,
        devicesProcessed: 0,
        devicesImported: 0,
        conflicts: 0
      },
      message: 'Import functionality is being rebuilt',
      errors: [],
      duration: calculateLatency(startTime)
    };

    console.log('✅ [enhanced-bulk-import] Import placeholder completed');

    return createSuccessResponse({
      success: true,
      ...importResult
    }, calculateLatency(startTime));

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Import failed:', error);
    
    const failedImportResult: GP51ImportResult = {
      success: false,
      statistics: {
        usersProcessed: 0,
        usersImported: 0,
        devicesProcessed: 0,
        devicesImported: 0,
        conflicts: 0
      },
      message: error instanceof Error ? error.message : 'Import failed',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      duration: calculateLatency(startTime)
    };

    return createSuccessResponse({
      success: false,
      ...failedImportResult
    }, calculateLatency(startTime));
  }
}
