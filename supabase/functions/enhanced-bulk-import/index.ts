
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51SessionValidationResult {
  valid: boolean;
  sessionId?: string;
  username?: string;
  minutesUntilExpiry?: number;
  authMethod?: string;
  userId?: string;
}

interface GP51Device {
  deviceid: string;
  devicename?: string;
  devicetype?: number;
  simnum?: string;
  lastactivetime?: number;
  isfree?: number;
  allowedit?: number;
  loginame?: string;
  creater?: string;
  remark?: string;
}

interface GP51Group {
  groupid: number;
  groupname: string;
  remark?: string;
  devices: GP51Device[];
}

interface GP51User {
  username: string;
  showname?: string;
  email?: string;
  usertype?: number;
  phone?: string;
}

interface ImportPreviewData {
  vehicles: {
    total: number;
    sample: GP51Device[];
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
    sample: GP51Group[];
  };
  summary: {
    totalDevices: number;
    totalUsers: number;
    totalGroups: number;
    lastUpdate: string;
    estimatedImportTime: string;
  };
}

async function validateGP51Session(): Promise<GP51SessionValidationResult> {
  console.log('🔍 [GP51SessionUtils] Validating GP51 session...');
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { data: sessions, error } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('token_expires_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ [GP51SessionUtils] Database error:', error);
      return { valid: false };
    }

    if (!sessions || sessions.length === 0) {
      console.log('⚠️ [GP51SessionUtils] No GP51 sessions found');
      return { valid: false };
    }

    const session = sessions[0];
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();
    const minutesUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60));

    if (expiresAt <= now) {
      console.log('⏰ [GP51SessionUtils] Session expired');
      return { valid: false };
    }

    console.log(`✅ [GP51SessionUtils] Valid session found: {
  sessionId: "${session.id}",
  username: "${session.username}",
  userId: "${session.envio_user_id}",
  minutesUntilExpiry: ${minutesUntilExpiry},
  authMethod: "${session.auth_method || 'unknown'}"
}`);

    return {
      valid: true,
      sessionId: session.gp51_token,
      username: session.username,
      minutesUntilExpiry,
      authMethod: session.auth_method || 'unknown',
      userId: session.envio_user_id
    };
  } catch (error) {
    console.error('❌ [GP51SessionUtils] Validation error:', error);
    return { valid: false };
  }
}

async function testGP51Connection(token: string): Promise<{ success: boolean; response?: any; error?: string }> {
  console.log('🧪 [DIAGNOSTICS] Phase 3: Testing GP51 API connectivity...');
  
  try {
    const testUrl = `https://www.gps51.com/webapi?action=querymonitorlist&token=${token}`;
    console.log('🔗 [DIAGNOSTICS] Testing API with URL: https://www.gps51.com/webapi?action=querymonitorlist&token=[TOKEN]');
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    const responseText = await response.text();
    console.log(`📋 [DIAGNOSTICS] API Response (first 200 chars): ${responseText.substring(0, 200)}`);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${responseText}` };
    }

    // Try to parse as JSON, but don't fail if it's not
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = { raw_response: responseText };
    }

    console.log('✅ [DIAGNOSTICS] API test successful (plain text response)');
    return { success: true, response: parsedResponse };
  } catch (error) {
    console.error('❌ [DIAGNOSTICS] API test failed:', error);
    return { success: false, error: error.message };
  }
}

async function fetchGP51Data(token: string, action: string): Promise<{ success: boolean; data?: any; error?: string }> {
  console.log(`🔄 [GP51_FETCH] Fetching ${action} from: https://www.gps51.com/webapi?action=${action}&token=[TOKEN]`);
  
  try {
    const url = `https://www.gps51.com/webapi?action=${action}&token=${token}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      signal: AbortSignal.timeout(20000)
    });

    const responseText = await response.text();
    console.log(`📋 [GP51_FETCH] ${action} response length: ${responseText.length}`);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${responseText}` };
    }

    // Parse JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
      console.log(`✅ [GP51_FETCH] ${action} parsed successfully`);
    } catch (parseError) {
      console.error(`❌ [GP51_FETCH] Failed to parse ${action} response:`, parseError);
      return { success: false, error: `Invalid JSON response from ${action}` };
    }

    // Check GP51 API status
    if (parsedData.status !== undefined && parsedData.status !== 0) {
      console.error(`❌ [GP51_FETCH] ${action} API error:`, parsedData.cause || 'Unknown error');
      return { success: false, error: parsedData.cause || `GP51 API error for ${action}` };
    }

    return { success: true, data: parsedData };
  } catch (error) {
    console.error(`❌ [GP51_FETCH] ${action} request failed:`, error);
    return { success: false, error: error.message };
  }
}

async function discoverGP51Data(token: string): Promise<ImportPreviewData> {
  console.log('📊 [PREVIEW] Starting data discovery for import preview...');
  
  // Fetch vehicles/devices
  console.log('📊 [PREVIEW] Fetching vehicle list...');
  const vehicleResult = await fetchGP51Data(token, 'querymonitorlist');
  
  // Fetch users
  console.log('📊 [PREVIEW] Fetching user list...');
  const userResult = await fetchGP51Data(token, 'getuserlist');
  
  // Fetch groups
  console.log('📊 [PREVIEW] Fetching group list...');
  const groupResult = await fetchGP51Data(token, 'getgrouplist');

  // Process vehicles
  let vehicles: GP51Device[] = [];
  let groups: GP51Group[] = [];
  
  if (vehicleResult.success && vehicleResult.data) {
    if (vehicleResult.data.groups && Array.isArray(vehicleResult.data.groups)) {
      groups = vehicleResult.data.groups;
      vehicles = groups.flatMap(group => group.devices || []);
    } else if (vehicleResult.data.devices && Array.isArray(vehicleResult.data.devices)) {
      vehicles = vehicleResult.data.devices;
    }
  }

  // Process users
  let users: GP51User[] = [];
  if (userResult.success && userResult.data) {
    if (Array.isArray(userResult.data)) {
      users = userResult.data;
    } else if (userResult.data.users && Array.isArray(userResult.data.users)) {
      users = userResult.data.users;
    }
  }

  // Process additional groups if available
  if (groupResult.success && groupResult.data && Array.isArray(groupResult.data)) {
    groups = [...groups, ...groupResult.data];
  }

  // Calculate statistics
  const activeVehicles = vehicles.filter(v => v.isfree === 0 || v.isfree === false).length;
  const inactiveVehicles = vehicles.length - activeVehicles;
  const activeUsers = users.filter(u => u.usertype && u.usertype > 0).length;

  // Estimate import time (rough calculation)
  const totalItems = vehicles.length + users.length;
  const estimatedMinutes = Math.max(1, Math.ceil(totalItems / 100)); // Assume 100 items per minute
  const estimatedTime = estimatedMinutes === 1 ? '1 minute' : `${estimatedMinutes} minutes`;

  const previewData: ImportPreviewData = {
    vehicles: {
      total: vehicles.length,
      sample: vehicles.slice(0, 5),
      activeCount: activeVehicles,
      inactiveCount: inactiveVehicles
    },
    users: {
      total: users.length,
      sample: users.slice(0, 5),
      activeCount: activeUsers
    },
    groups: {
      total: groups.length,
      sample: groups.slice(0, 3)
    },
    summary: {
      totalDevices: vehicles.length,
      totalUsers: users.length,
      totalGroups: groups.length,
      lastUpdate: new Date().toISOString(),
      estimatedImportTime: estimatedTime
    }
  };

  console.log(`✅ [PREVIEW] Data discovery completed: { vehicles: ${vehicles.length}, users: ${users.length}, groups: ${groups.length} }`);
  
  return previewData;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    console.log(`🚀 [enhanced-bulk-import] ${req.method} ${req.url}`);
    console.log(`🔧 [enhanced-bulk-import] Action: ${action}`);

    if (action === 'test_connection') {
      console.log('🧪 [enhanced-bulk-import] Starting comprehensive connection test...');
      
      // Phase 1: Check GP51 sessions
      console.log('🔍 [DIAGNOSTICS] Starting comprehensive GP51 session diagnostics...');
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: allSessions, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .order('token_expires_at', { ascending: false });

      if (error) {
        return new Response(JSON.stringify({
          success: false,
          error: `Database error: ${error.message}`
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`📊 [DIAGNOSTICS] Phase 1: Retrieving GP51 sessions...`);
      console.log(`📋 [DIAGNOSTICS] Found ${allSessions?.length || 0} total sessions in database`);
      console.log(`🕐 [DIAGNOSTICS] Current time: ${new Date().toISOString()}`);

      if (!allSessions || allSessions.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No GP51 sessions found',
          details: 'Please configure GP51 authentication first'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Find valid session
      const validSession = allSessions.find(session => {
        const expiresAt = new Date(session.token_expires_at);
        const now = new Date();
        return expiresAt > now;
      });

      if (!validSession) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No valid GP51 sessions found',
          details: 'All sessions have expired. Please refresh your GP51 credentials.'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const expiresAt = new Date(validSession.token_expires_at);
      const now = new Date();
      const timeUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

      console.log(`📄 [DIAGNOSTICS] Session: ${validSession.username}`);
      console.log(`   - Token exists: ${!!validSession.gp51_token}`);
      console.log(`   - Token length: ${validSession.gp51_token?.length || 0}`);
      console.log(`   - Expires at: ${validSession.token_expires_at}`);
      console.log(`   - Is expired: ${expiresAt <= now}`);
      console.log(`   - Time until expiry: ${timeUntilExpiry} seconds`);
      console.log(`   - Auth method: ${validSession.auth_method || 'unknown'}`);

      console.log(`✅ [DIAGNOSTICS] Found valid session for user: ${validSession.username}`);

      const sessionDetails = {
        username: validSession.username,
        tokenExists: !!validSession.gp51_token,
        tokenLength: validSession.gp51_token?.length || 0,
        expiresAt: validSession.token_expires_at,
        timeUntilExpiry,
        sessionAge: Math.floor((now.getTime() - new Date(validSession.created_at).getTime()) / 1000),
        authMethod: validSession.auth_method || 'unknown',
        apiUrl: validSession.api_url || 'https://www.gps51.com/webapi'
      };

      console.log(`✅ [DIAGNOSTICS] Session details compiled: ${JSON.stringify(sessionDetails, null, 2)}`);

      // Phase 2: Test GP51 API connectivity
      const connectionTest = await testGP51Connection(validSession.gp51_token);

      console.log('✅ [enhanced-bulk-import] Connection test completed successfully');

      return new Response(JSON.stringify({
        success: true,
        sessionDetails,
        connectionTest,
        message: 'GP51 connection test successful'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'fetch_available_data') {
      console.log('📊 [enhanced-bulk-import] Fetching available data for import preview...');
      
      // Validate session first
      const sessionValidation = await validateGP51Session();
      if (!sessionValidation.valid) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid or expired GP51 session'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Fetch and process data
      const previewData = await discoverGP51Data(sessionValidation.sessionId!);

      return new Response(JSON.stringify({
        success: true,
        data: previewData
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'start_import') {
      console.log('🚀 [enhanced-bulk-import] Starting import process...');
      
      // Validate session
      const sessionValidation = await validateGP51Session();
      if (!sessionValidation.valid) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid or expired GP51 session'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // For now, return a placeholder response
      // This will be implemented in Phase 3
      return new Response(JSON.stringify({
        success: true,
        message: 'Import functionality coming in Phase 3',
        importId: 'placeholder-' + Date.now()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Unknown action'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
