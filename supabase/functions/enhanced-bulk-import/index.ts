import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { getValidGp51Session } from '../_shared/gp51_session_utils.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/response_utils.ts';
import { authStrategies } from './gp51-auth-strategies.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51Vehicle {
  deviceid: string;
  devicename: string;
  username?: string;
  sim?: string;
  devicetype?: string;
  groupname?: string;
  lastupdate?: string;
}

interface GP51User {
  userid: string;
  username: string;
  email?: string;
  phone?: string;
  usertype?: string;
}

interface ImportPreviewData {
  vehicles: {
    total: number;
    sample: GP51Vehicle[];
    activeCount: number;
    inactiveCount: number;
  };
  users: {
    total: number;
    sample: GP51User[];
    activeCount: number;
  };
  groups: {
    total: number;
    sample: Array<{ groupid: string; groupname: string; devicecount: number }>;
  };
  summary: {
    totalDevices: number;
    totalUsers: number;
    totalGroups: number;
    lastUpdate: string;
    estimatedImportTime: string;
  };
}

async function fetchGP51Data(session: any, action: string): Promise<any> {
  const baseUrl = session.api_url || 'https://www.gps51.com/webapi';
  
  const url = new URL(baseUrl);
  url.searchParams.set('action', action);
  url.searchParams.set('token', session.gp51_token);
  url.searchParams.set('from', 'WEB');
  url.searchParams.set('type', 'USER');

  console.log(`🔄 [GP51_FETCH] Fetching ${action} from: ${url.toString().replace(session.gp51_token, '[TOKEN]')}`);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json, text/plain',
      'User-Agent': 'FleetIQ/1.0'
    },
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const responseText = await response.text();
  
  // Try to parse as JSON
  try {
    const jsonData = JSON.parse(responseText);
    if (jsonData.status === 0) {
      return jsonData.data || jsonData;
    } else {
      throw new Error(jsonData.cause || jsonData.message || 'GP51 API error');
    }
  } catch (parseError) {
    // If not JSON, return as text
    if (responseText.trim() && !responseText.includes('error') && !responseText.includes('<html')) {
      return responseText.trim();
    }
    throw new Error(`Invalid response: ${responseText.substring(0, 100)}`);
  }
}

async function generateImportPreview(session: any): Promise<ImportPreviewData> {
  console.log('📊 [PREVIEW] Starting data discovery for import preview...');
  
  try {
    // Fetch vehicles/devices
    console.log('📊 [PREVIEW] Fetching vehicle list...');
    const vehiclesData = await fetchGP51Data(session, 'getmonitorlist');
    const vehicles: GP51Vehicle[] = Array.isArray(vehiclesData) ? vehiclesData : [];
    
    // Fetch users
    console.log('📊 [PREVIEW] Fetching user list...');
    let users: GP51User[] = [];
    try {
      const usersData = await fetchGP51Data(session, 'getuserlist');
      users = Array.isArray(usersData) ? usersData : [];
    } catch (error) {
      console.log('⚠️ [PREVIEW] User list not available:', error.message);
    }

    // Fetch groups
    console.log('📊 [PREVIEW] Fetching group list...');
    let groups: Array<{ groupid: string; groupname: string; devicecount: number }> = [];
    try {
      const groupsData = await fetchGP51Data(session, 'getgrouplist');
      groups = Array.isArray(groupsData) ? groupsData : [];
    } catch (error) {
      console.log('⚠️ [PREVIEW] Group list not available:', error.message);
    }

    // Process and analyze data
    const activeVehicles = vehicles.filter(v => v.lastupdate && 
      new Date(v.lastupdate).getTime() > (Date.now() - 30 * 24 * 60 * 60 * 1000)); // Active in last 30 days
    const activeUsers = users.filter(u => u.usertype !== 'inactive');

    // Calculate estimated import time (rough estimate: 50 vehicles per minute)
    const totalItems = vehicles.length + users.length;
    const estimatedMinutes = Math.ceil(totalItems / 50);
    const estimatedTime = estimatedMinutes < 60 
      ? `${estimatedMinutes} minutes` 
      : `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`;

    const previewData: ImportPreviewData = {
      vehicles: {
        total: vehicles.length,
        sample: vehicles.slice(0, 10), // First 10 as sample
        activeCount: activeVehicles.length,
        inactiveCount: vehicles.length - activeVehicles.length
      },
      users: {
        total: users.length,
        sample: users.slice(0, 10), // First 10 as sample
        activeCount: activeUsers.length
      },
      groups: {
        total: groups.length,
        sample: groups.slice(0, 10) // First 10 as sample
      },
      summary: {
        totalDevices: vehicles.length,
        totalUsers: users.length,
        totalGroups: groups.length,
        lastUpdate: new Date().toISOString(),
        estimatedImportTime: estimatedTime
      }
    };

    console.log('✅ [PREVIEW] Data discovery completed:', {
      vehicles: previewData.vehicles.total,
      users: previewData.users.total,
      groups: previewData.groups.total
    });

    return previewData;

  } catch (error) {
    console.error('❌ [PREVIEW] Data discovery failed:', error);
    throw error;
  }
}

async function runComprehensiveDiagnostics(): Promise<any> {
  console.log('🔍 [DIAGNOSTICS] Starting comprehensive GP51 session diagnostics...');
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Phase 1: Retrieve GP51 sessions
    console.log('📊 [DIAGNOSTICS] Phase 1: Retrieving GP51 sessions...');
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionError) {
      throw new Error(`Database error: ${sessionError.message}`);
    }

    console.log('📋 [DIAGNOSTICS] Found', sessions?.length || 0, 'total sessions in database');
    console.log('🕐 [DIAGNOSTICS] Current time:', new Date().toISOString());

    if (!sessions || sessions.length === 0) {
      return {
        success: false,
        phase: 'session_retrieval',
        error: 'No GP51 sessions found in database',
        details: { sessionCount: 0 }
      };
    }

    // Analyze sessions
    const sessionDetails = sessions.map((session, index) => {
      const now = new Date();
      const expiresAt = new Date(session.token_expires_at);
      const createdAt = new Date(session.created_at);
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const sessionAge = now.getTime() - createdAt.getTime();
      
      console.log(`📄 [DIAGNOSTICS] Session ${index + 1}: ${session.username}, expires: ${session.token_expires_at}, created: ${session.created_at}`);
      
      return {
        username: session.username,
        tokenExists: !!session.gp51_token,
        tokenLength: session.gp51_token?.length || 0,
        expiresAt: session.token_expires_at,
        isExpired: expiresAt <= now,
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000), // seconds
        sessionAge: Math.round(sessionAge / 1000), // seconds
        authMethod: session.auth_method || 'unknown',
        apiUrl: session.api_url || 'https://www.gps51.com/webapi'
      };
    });

    // Find valid session
    const validSession = sessions.find(session => {
      const expiresAt = new Date(session.token_expires_at);
      return expiresAt > new Date() && session.gp51_token && session.username;
    });

    if (!validSession) {
      return {
        success: false,
        phase: 'session_validation',
        error: 'No valid GP51 sessions found',
        details: { 
          totalSessions: sessions.length,
          sessionDetails,
          allExpired: sessions.every(s => new Date(s.token_expires_at) <= new Date())
        }
      };
    }

    console.log('✅ [DIAGNOSTICS] Found valid session for user:', validSession.username);

    const sessionDetail = sessionDetails.find(s => s.username === validSession.username);
    console.log('✅ [DIAGNOSTICS] Session details compiled:', sessionDetail);

    // Phase 3: Test GP51 API connectivity
    console.log('🧪 [DIAGNOSTICS] Phase 3: Testing GP51 API connectivity...');
    
    const apiUrl = validSession.api_url || 'https://www.gps51.com/webapi';
    const testUrl = new URL(apiUrl);
    testUrl.searchParams.set('action', 'getmonitorlist');
    testUrl.searchParams.set('token', validSession.gp51_token);

    console.log('🔗 [DIAGNOSTICS] Testing API with URL:', testUrl.toString().replace(validSession.gp51_token, '[TOKEN]'));

    const apiResponse = await fetch(testUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    const responseText = await apiResponse.text();
    console.log('📋 [DIAGNOSTICS] API Response (first 200 chars):', responseText.substring(0, 200));

    let apiTestResult;
    try {
      const jsonResponse = JSON.parse(responseText);
      if (jsonResponse.status === 0) {
        apiTestResult = {
          success: true,
          type: 'json',
          dataCount: Array.isArray(jsonResponse.data) ? jsonResponse.data.length : 0,
          response: jsonResponse
        };
        console.log('✅ [DIAGNOSTICS] API test successful (JSON response)');
      } else {
        apiTestResult = {
          success: false,
          type: 'json_error',
          error: jsonResponse.cause || jsonResponse.message,
          response: jsonResponse
        };
      }
    } catch (parseError) {
      if (responseText.trim() && !responseText.includes('error') && !responseText.includes('<html')) {
        apiTestResult = {
          success: true,
          type: 'plain_text',
          response: responseText.trim()
        };
        console.log('✅ [DIAGNOSTICS] API test successful (plain text response)');
      } else {
        apiTestResult = {
          success: false,
          type: 'invalid_response',
          error: 'Invalid or error response',
          response: responseText.substring(0, 200)
        };
      }
    }

    console.log('✅ [DIAGNOSTICS] Connection test completed successfully');

    return {
      success: true,
      phase: 'completed',
      sessionDetails: sessionDetail,
      apiTest: apiTestResult,
      recommendations: apiTestResult.success 
        ? ['GP51 connection is healthy and ready for import operations']
        : ['Check GP51 token validity', 'Verify API endpoint accessibility', 'Review authentication settings']
    };

  } catch (error) {
    console.error('❌ [DIAGNOSTICS] Connection test failed:', error);
    return {
      success: false,
      phase: 'connection_test',
      error: error.message,
      details: { errorType: error.name, stack: error.stack }
    };
  }
}

Deno.serve(async (req) => {
  console.log(`🚀 [enhanced-bulk-import] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...requestData } = await req.json();
    console.log(`🔧 [enhanced-bulk-import] Action: ${action}`);

    switch (action) {
      case 'test_connection':
        console.log('🧪 [enhanced-bulk-import] Starting comprehensive connection test...');
        const diagnostics = await runComprehensiveDiagnostics();
        console.log('📊 [enhanced-bulk-import] Session test response:', JSON.stringify(diagnostics).substring(0, 200));
        return createSuccessResponse(diagnostics, corsHeaders);

      case 'fetch_available_data':
        console.log('📊 [enhanced-bulk-import] Fetching available data for import preview...');
        
        const { session, errorResponse } = await getValidGp51Session();
        if (errorResponse) {
          return errorResponse;
        }

        const previewData = await generateImportPreview(session);
        return createSuccessResponse(previewData, corsHeaders);

      case 'start_import':
        console.log('🚀 [enhanced-bulk-import] Starting bulk import process...');
        
        // TODO: Implement in Phase 3
        return createErrorResponse('Import functionality coming soon', 'This feature is being implemented in phases', 501, corsHeaders);

      default:
        return createErrorResponse('Invalid action', `Unknown action: ${action}`, 400, corsHeaders);
    }

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Request failed:', error);
    return createErrorResponse(
      'Request processing failed',
      error.message,
      500,
      corsHeaders
    );
  }
});
