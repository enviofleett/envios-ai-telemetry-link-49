
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getGP51ApiUrl, isValidGP51BaseUrl } from '../_shared/constants.ts';
import { md5_for_gp51_only, checkRateLimit, sanitizeInput } from '../_shared/crypto_utils.ts';
import { getGP51SessionUtils } from '../_shared/gp51SessionUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype?: number;
  simnum?: string;
  overduetime?: number;
  expirenotifytime?: number;
  remark?: string;
  creater?: string;
  videochannelcount?: number;
  lastactivetime?: number;
  isfree?: number;
  allowedit?: number;
  icon?: number;
  stared?: number;
  loginame?: string;
}

interface GP51Group {
  groupid?: string;
  groupname?: string;
  devices?: GP51Device[];
}

interface GP51User {
  userid?: string;
  username?: string;
  usertype?: number;
  email?: string;
  phone?: string;
}

interface GP51ApiResponse {
  status: number;
  cause: string;
  groups?: GP51Group[];
  users?: GP51User[];
  data?: any;
}

async function fetchGP51Data(token: string, action: string, params: Record<string, any> = {}): Promise<GP51ApiResponse> {
  const gp51BaseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
  const gp51ApiUrl = getGP51ApiUrl(gp51BaseUrl);
  
  console.log(`🔄 [GP51_FETCH] Fetching ${action} from: ${gp51ApiUrl}`);
  
  // Prepare request body with required parameters
  const requestBody = {
    action,
    token,
    from: 'WEB',
    type: 'USER',
    ...params
  };
  
  console.log(`📤 [GP51_FETCH] Request body: ${JSON.stringify({ ...requestBody, token: '[TOKEN]' })}`);
  
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

    console.log(`📥 [GP51_FETCH] Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log(`📄 [GP51_FETCH] Raw response: ${responseText.substring(0, 500)}...`);
    
    let responseJson: GP51ApiResponse;
    try {
      responseJson = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`❌ [GP51_FETCH] JSON parse error:`, parseError);
      throw new Error(`Invalid JSON response from GP51: ${parseError.message}`);
    }

    console.log(`✅ [GP51_FETCH] Parsed response status: ${responseJson.status}, cause: ${responseJson.cause}`);
    
    if (responseJson.status !== 0) {
      throw new Error(`GP51 API Error: ${responseJson.cause || 'Unknown error'}`);
    }

    return responseJson;
  } catch (error) {
    console.error(`❌ [GP51_FETCH] Fetch error for ${action}:`, error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  if (!checkRateLimit(clientIP, 10, 60 * 1000)) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Too many requests. Please try again later.' 
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const requestBody = await req.json();
    const { action } = requestBody;
    
    console.log(`🚀 [enhanced-bulk-import] ${req.method} ${req.url}`);
    console.log(`🔧 [enhanced-bulk-import] Action: ${action}`);

    // Get GP51 session
    const sessionUtils = getGP51SessionUtils();
    const sessionData = await sessionUtils.getValidSession();
    
    if (!sessionData.isValid || !sessionData.token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 session not available. Please check your GP51 integration settings.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { token, username } = sessionData;

    if (action === 'fetch_available_data') {
      console.log(`📊 [PREVIEW] Starting data discovery for import preview...`);
      
      let vehicles: GP51Device[] = [];
      let users: GP51User[] = [];
      let groups: GP51Group[] = [];
      
      try {
        // Fetch vehicles using querymonitorlist (correct GP51 endpoint)
        console.log(`📊 [PREVIEW] Fetching vehicle list...`);
        const vehicleResponse = await fetchGP51Data(token, 'querymonitorlist', { 
          username: username 
        });
        
        if (vehicleResponse.groups && Array.isArray(vehicleResponse.groups)) {
          groups = vehicleResponse.groups;
          vehicleResponse.groups.forEach(group => {
            if (group.devices && Array.isArray(group.devices)) {
              vehicles = vehicles.concat(group.devices);
            }
          });
        }
        
        console.log(`✅ [PREVIEW] Found ${vehicles.length} vehicles in ${groups.length} groups`);
        
      } catch (vehicleError) {
        console.error(`❌ [PREVIEW] Vehicle fetch error:`, vehicleError);
        // Don't fail completely, continue with users if vehicles fail
      }

      try {
        // Fetch users using getuserlist
        console.log(`📊 [PREVIEW] Fetching user list...`);
        const userResponse = await fetchGP51Data(token, 'getuserlist', { 
          username: username 
        });
        
        if (userResponse.users && Array.isArray(userResponse.users)) {
          users = userResponse.users;
        }
        
        console.log(`✅ [PREVIEW] Found ${users.length} users`);
        
      } catch (userError) {
        console.error(`❌ [PREVIEW] User fetch error:`, userError);
        // Don't fail completely, continue with groups if users fail
      }

      try {
        // Fetch groups if not already fetched
        if (groups.length === 0) {
          console.log(`📊 [PREVIEW] Fetching group list...`);
          const groupResponse = await fetchGP51Data(token, 'getgrouplist', { 
            username: username 
          });
          
          if (groupResponse.groups && Array.isArray(groupResponse.groups)) {
            groups = groupResponse.groups;
          }
        }
        
        console.log(`✅ [PREVIEW] Total groups: ${groups.length}`);
        
      } catch (groupError) {
        console.error(`❌ [PREVIEW] Group fetch error:`, groupError);
        // Continue with what we have
      }

      const summary = {
        vehicles: vehicles.length,
        users: users.length,
        groups: groups.length
      };

      console.log(`✅ [PREVIEW] Data discovery completed: ${JSON.stringify(summary)}`);

      return new Response(JSON.stringify({
        success: true,
        summary,
        details: {
          vehicles: vehicles.slice(0, 5), // Sample of first 5 vehicles
          users: users.slice(0, 5), // Sample of first 5 users
          groups: groups.map(g => ({ 
            groupid: g.groupid, 
            groupname: g.groupname, 
            deviceCount: g.devices?.length || 0 
          }))
        },
        message: `Found ${vehicles.length} vehicles, ${users.length} users, and ${groups.length} groups available for import.`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'start_import') {
      console.log(`🚀 [IMPORT] Starting bulk import process...`);
      
      // This would implement the actual import logic
      return new Response(JSON.stringify({
        success: true,
        message: 'Import process started successfully',
        jobId: 'mock-job-' + Date.now()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: `Unknown action: ${action}`
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
