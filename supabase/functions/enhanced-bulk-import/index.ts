
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getGP51ApiUrl } from '../_shared/constants.ts';
import { md5_for_gp51_only, sanitizeInput } from '../_shared/crypto_utils.ts';
import { createSuccessResponse, createErrorResponse } from '../_shared/response_utils.ts';
import { getValidGp51Session, updateSessionActivity } from '../_shared/gp51_session_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51DeviceResponse {
  status: number;
  cause: string;
  groups?: Array<{
    groupname: string;
    devices?: Array<{
      deviceid: string;
      devicename: string;
      devicetype: number;
      simnum?: string;
      isfree?: number;
      allowedit?: number;
      lastactivetime?: number;
      creater?: string;
      remark?: string;
    }>;
  }>;
}

interface GP51UserResponse {
  status: number;
  cause: string;
  users?: Array<{
    username: string;
    usertype: number;
    deviceids?: string[];
    email?: string;
    showname?: string;
  }>;
}

async function fetchFromGP51Api(action: string, token: string, username?: string) {
  const gp51BaseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
  const gp51ApiUrl = getGP51ApiUrl(gp51BaseUrl);
  
  console.log(`🔄 [GP51_FETCH] Fetching ${action} from: ${gp51ApiUrl}?action=${action}&token=[TOKEN]`);
  
  const requestBody: any = {
    action: action,
    token: token
  };

  if (username) {
    requestBody.username = username;
  }

  try {
    const response = await fetch(gp51ApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000)
    });

    const responseText = await response.text();
    console.log(`📋 [GP51_FETCH] ${action} response length: ${responseText.length}`);

    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
      console.log(`✅ [GP51_FETCH] ${action} parsed successfully`);
    } catch (parseError) {
      console.error(`❌ [GP51_FETCH] ${action} JSON parse error:`, parseError);
      throw new Error(`Failed to parse ${action} response`);
    }

    if (responseJson.status !== 0) {
      console.error(`❌ [GP51_FETCH] ${action} API error: ${responseJson.cause}`);
      throw new Error(`GP51 API error for ${action}: ${responseJson.cause}`);
    }

    return responseJson;
  } catch (error) {
    console.error(`❌ [GP51_FETCH] ${action} request failed:`, error);
    throw error;
  }
}

async function fetchAvailableData(token: string, username: string) {
  console.log('📊 [PREVIEW] Starting data discovery for import preview...');
  
  try {
    // Fetch vehicles using querymonitorlist
    console.log('📊 [PREVIEW] Fetching vehicle list...');
    const vehicleResponse = await fetchFromGP51Api('querymonitorlist', token, username) as GP51DeviceResponse;
    
    // Process vehicle data
    let totalVehicles = 0;
    let vehicleDetails: any[] = [];
    
    if (vehicleResponse.groups && Array.isArray(vehicleResponse.groups)) {
      vehicleResponse.groups.forEach(group => {
        if (group.devices && Array.isArray(group.devices)) {
          totalVehicles += group.devices.length;
          vehicleDetails = vehicleDetails.concat(group.devices.map(device => ({
            deviceid: device.deviceid,
            devicename: device.devicename,
            devicetype: device.devicetype,
            simnum: device.simnum,
            conflict: false // For now, assume no conflicts
          })));
        }
      });
    }
    
    // Fetch users using getuserlist  
    console.log('📊 [PREVIEW] Fetching user list...');
    let totalUsers = 0;
    let userDetails: any[] = [];
    
    try {
      const userResponse = await fetchFromGP51Api('getuserlist', token) as GP51UserResponse;
      if (userResponse.users && Array.isArray(userResponse.users)) {
        totalUsers = userResponse.users.length;
        userDetails = userResponse.users.map(user => ({
          username: user.username,
          email: user.email || '',
          usertype: user.usertype,
          conflict: false
        }));
      }
    } catch (userError) {
      console.warn('⚠️ [PREVIEW] Failed to fetch users, continuing with vehicles only:', userError);
    }
    
    // Fetch groups using getgrouplist
    console.log('📊 [PREVIEW] Fetching group list...');
    let totalGroups = 0;
    let groupDetails: any[] = [];
    
    try {
      const groupResponse = await fetchFromGP51Api('getgrouplist', token);
      if (groupResponse.groups && Array.isArray(groupResponse.groups)) {
        totalGroups = groupResponse.groups.length;
        groupDetails = groupResponse.groups.map((group: any) => ({
          groupname: group.groupname || 'Unnamed Group',
          groupid: group.groupid || group.id,
          deviceCount: group.devicecount || 0,
          conflict: false
        }));
      }
    } catch (groupError) {
      console.warn('⚠️ [PREVIEW] Failed to fetch groups, continuing without groups:', groupError);
    }

    console.log(`✅ [PREVIEW] Data discovery completed: { vehicles: ${totalVehicles}, users: ${totalUsers}, groups: ${totalGroups} }`);

    return {
      success: true,
      summary: {
        vehicles: totalVehicles,
        users: totalUsers,
        groups: totalGroups
      },
      details: {
        vehicles: vehicleDetails.slice(0, 10), // Limit preview to first 10
        users: userDetails.slice(0, 10),
        groups: groupDetails.slice(0, 10)
      },
      message: `Found ${totalVehicles} vehicles, ${totalUsers} users, and ${totalGroups} groups available for import.`
    };

  } catch (error) {
    console.error('❌ [PREVIEW] Data discovery failed:', error);
    return {
      success: false,
      summary: {
        vehicles: 0,
        users: 0,
        groups: 0
      },
      details: {
        vehicles: [],
        users: [],
        groups: []
      },
      message: `Failed to fetch data from GP51: ${error.message}`,
      error: error.message
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [enhanced-bulk-import] POST http://bjkqxmvjuewshomihjqm.supabase.co/enhanced-bulk-import');
    
    const { action } = await req.json();
    console.log(`🔧 [enhanced-bulk-import] Action: ${action}`);

    if (action === 'fetch_available_data') {
      console.log('📊 [enhanced-bulk-import] Fetching available data for import preview...');
      
      // Get valid GP51 session
      const { session, errorResponse } = await getValidGp51Session();
      
      if (errorResponse) {
        return errorResponse;
      }

      if (!session) {
        return createErrorResponse(
          'No GP51 session available',
          'Please authenticate with GP51 first',
          401
        );
      }

      // Update session activity
      await updateSessionActivity(session.id);

      // Fetch available data from GP51
      const result = await fetchAvailableData(session.gp51_token, session.username);
      
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return createErrorResponse(
      'Invalid action',
      `Action '${action}' is not supported`,
      400
    );

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Unexpected error:', error);
    return createErrorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});
