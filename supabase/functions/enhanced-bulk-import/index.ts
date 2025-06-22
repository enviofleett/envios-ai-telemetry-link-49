
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// GP51 session utilities
async function getValidGP51Session(supabase: any) {
  console.log('🔍 [GP51SessionUtils] Validating GP51 session...');
  
  const { data: sessions, error } = await supabase
    .from('gp51_sessions')
    .select('*')
    .gt('token_expires_at', new Date().toISOString())
    .order('last_activity_at', { ascending: false })
    .limit(1);

  if (error || !sessions || sessions.length === 0) {
    throw new Error('No valid GP51 sessions found');
  }

  const session = sessions[0];
  const expiresAt = new Date(session.token_expires_at);
  const now = new Date();
  const minutesUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60));

  console.log(`✅ [GP51SessionUtils] Valid session found: {
  sessionId: "${session.id}",
  username: "${session.username}",
  userId: "${session.envio_user_id}",
  minutesUntilExpiry: ${minutesUntilExpiry},
  authMethod: "${session.auth_method || 'unknown'}"
}`);

  return session;
}

async function fetchFromGP51Api(action: string, token: string, username: string, additionalParams: Record<string, any> = {}) {
  const gp51BaseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
  const apiUrl = `${gp51BaseUrl}/webapi`;
  
  console.log(`🔄 [GP51_FETCH] Fetching ${action} from: ${apiUrl}?action=${action}&token=[TOKEN]`);
  console.log(`🔐 [GP51_FETCH] Auth details - Username: ${username}, Token length: ${token.length}`);

  const requestBody = {
    action,
    token,
    username,
    ...additionalParams
  };

  console.log(`📤 [GP51_FETCH] Request body: ${JSON.stringify({
    ...requestBody,
    token: '[REDACTED]'
  })}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000)
    });

    console.log(`📡 [GP51_FETCH] ${action} HTTP response status: ${response.status} ${response.statusText}`);
    console.log(`📡 [GP51_FETCH] ${action} response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);

    const responseText = await response.text();
    console.log(`📋 [GP51_FETCH] ${action} response length: ${responseText.length}`);
    console.log(`📋 [GP51_FETCH] ${action} RAW RESPONSE BODY: ${responseText}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
      console.log(`✅ [GP51_FETCH] ${action} parsed successfully`);
      console.log(`📊 [GP51_FETCH] ${action} PARSED JSON: ${JSON.stringify(responseJson, null, 2)}`);
    } catch (parseError) {
      console.error(`❌ [GP51_FETCH] ${action} JSON parse error:`, parseError);
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }

    console.log(`📈 [GP51_FETCH] ${action} GP51 status: ${responseJson.status}, cause: "${responseJson.cause || 'N/A'}"`);

    if (responseJson.status !== 0) {
      console.error(`❌ [GP51_FETCH] ${action} API error: ${responseJson.cause || 'Unknown error'}`);
      console.error(`❌ [GP51_FETCH] ${action} Full error response: ${JSON.stringify(responseJson)}`);
      throw new Error(`GP51 API error for ${action}: ${responseJson.cause || 'Unknown error'}`);
    }

    return responseJson;
  } catch (error) {
    console.error(`❌ [GP51_FETCH] ${action} request failed:`, error);
    console.error(`❌ [GP51_FETCH] ${action} error details: ${error.message}`);
    throw error;
  }
}

async function fetchAvailableData(session: any) {
  console.log('📊 [PREVIEW] Starting data discovery for import preview...');
  console.log(`📊 [PREVIEW] Session info - Username: "${session.username}", Token: ${session.gp51_token.substring(0, 8)}...`);

  const results = {
    vehicles: 0,
    users: 0,
    groups: 0
  };

  try {
    // Try to fetch device list using the correct GP51 API action
    console.log('📊 [PREVIEW] Fetching vehicle list...');
    
    // The correct action for GP51 API is 'getmonitorlist', not 'querymonitorlist'
    const devicesResponse = await fetchFromGP51Api('getmonitorlist', session.gp51_token, session.username);
    
    if (devicesResponse.groups && Array.isArray(devicesResponse.groups)) {
      results.groups = devicesResponse.groups.length;
      
      // Count devices within groups
      let totalDevices = 0;
      for (const group of devicesResponse.groups) {
        if (group.devices && Array.isArray(group.devices)) {
          totalDevices += group.devices.length;
        }
      }
      results.vehicles = totalDevices;
      
      console.log(`📊 [PREVIEW] Found ${results.groups} groups with ${results.vehicles} total devices`);
    }

    // Try to fetch users using a different action
    try {
      console.log('📊 [PREVIEW] Fetching user list...');
      const usersResponse = await fetchFromGP51Api('getuserlist', session.gp51_token, session.username);
      
      if (usersResponse.users && Array.isArray(usersResponse.users)) {
        results.users = usersResponse.users.length;
        console.log(`📊 [PREVIEW] Found ${results.users} users`);
      }
    } catch (userError) {
      console.log(`ℹ️ [PREVIEW] User list fetch failed (this may be normal): ${userError.message}`);
      // Users fetch failure is not critical for the main functionality
    }

  } catch (error) {
    console.error('❌ [PREVIEW] Data discovery failed:', error);
    console.error('❌ [PREVIEW] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Don't throw here - return empty results instead
    // This allows the UI to show "No data found" instead of crashing
  }

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 [enhanced-bulk-import] POST http://bjkqxmvjuewshomihjqm.supabase.co/enhanced-bulk-import');

  try {
    const requestBody = await req.json();
    const { action } = requestBody;
    
    console.log(`🔧 [enhanced-bulk-import] Action: ${action}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (action) {
      case 'fetch_available_data': {
        console.log('📊 [enhanced-bulk-import] Fetching available data for import preview...');
        
        const session = await getValidGP51Session(supabase);
        console.log(`✅ [enhanced-bulk-import] Using session: ID=${session.id}, Username=${session.username}`);
        
        const results = await fetchAvailableData(session);
        
        console.log(`📊 [enhanced-bulk-import] Final result: ${JSON.stringify(results)}`);
        
        return new Response(JSON.stringify({
          success: true,
          summary: results,
          details: {
            vehicles: [],
            users: [],
            groups: []
          },
          message: results.vehicles > 0 ? 
            `Found ${results.vehicles} vehicles, ${results.users} users, and ${results.groups} groups available for import` :
            'No data available for import. Please check your GP51 connection.'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
