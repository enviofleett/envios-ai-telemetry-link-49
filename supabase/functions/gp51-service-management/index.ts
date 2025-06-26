
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`🔧 GP51 Service Management: Processing request`);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Method not allowed'
        }),
        { 
          status: 405, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const body = await req.json();
    const { action } = body;
    
    console.log(`🔧 GP51 Service Management: Processing action "${action}"`);

    switch (action) {
      case 'querymonitorlist':
        return await handleQueryMonitorList(body);
      
      case 'getpositions':
        return await handleGetPositions(body);
      
      case 'health_check':
        return await handleHealthCheck(body);
      
      default:
        console.log(`⚠️ Unknown action: ${action}`);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Unknown action: ${action}`
          }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
    }

  } catch (error) {
    console.error('💥 GP51 Service Management error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        cause: error.message
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});

async function handleQueryMonitorList(body: any) {
  try {
    console.log('📋 Handling querymonitorlist request');
    
    // Get GP51 session from environment or request
    const gp51Token = Deno.env.get('GP51_GLOBAL_API_TOKEN') || '6c1f1207c35d97a744837a19663ecdbe';
    const username = Deno.env.get('GP51_ADMIN_USERNAME') || 'octopus';
    
    console.log('🌐 Querying GP51 monitor list with token:', gp51Token);

    // Call GP51 API for device list
    const gp51Url = `https://www.gps51.com/webapi?action=querymonitorlist&token=${gp51Token}`;
    
    const gp51Response = await fetch(gp51Url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Envio-Fleet-GP51-Integration/1.0'
      },
      body: JSON.stringify({
        username: username
      })
    });

    console.log('📡 GP51 monitor list response:', {
      status: gp51Response.status,
      ok: gp51Response.ok
    });

    const responseText = await gp51Response.text();
    console.log('📄 GP51 response length:', responseText.length);
    
    if (!responseText || responseText.trim().length === 0) {
      console.log('⚠️ Empty response from GP51');
      return new Response(
        JSON.stringify({ 
          success: true,
          groups: [],
          devices: []
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    let deviceData;
    try {
      deviceData = JSON.parse(responseText);
      console.log('✅ Parsed device data:', {
        status: deviceData.status,
        groupCount: deviceData.groups?.length || 0
      });
    } catch (parseError) {
      console.error('❌ Failed to parse device response:', parseError);
      // Try treating as successful with empty data
      return new Response(
        JSON.stringify({ 
          success: true,
          groups: [],
          devices: []
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Check GP51 response status
    if (deviceData.status !== 0 && deviceData.status !== undefined) {
      console.error('❌ GP51 device query failed:', deviceData);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'GP51 device query failed',
          cause: deviceData.cause,
          groups: [],
          devices: []
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Transform GP51 data
    const transformedDevices = [];
    const transformedGroups = [];

    if (deviceData.groups && Array.isArray(deviceData.groups)) {
      deviceData.groups.forEach((group: any) => {
        // Add group info
        transformedGroups.push({
          id: group.groupid?.toString() || group.id?.toString(),
          group_name: group.groupname || group.group_name,
          group_id: group.groupid || group.id,
          device_count: group.devices?.length || 0,
          last_sync_at: new Date().toISOString(),
          remark: group.remark || '',
          devices: group.devices || []
        });

        // Add devices from this group
        if (group.devices && Array.isArray(group.devices)) {
          group.devices.forEach((device: any) => {
            transformedDevices.push({
              deviceId: device.deviceid || device.id,
              deviceName: device.devicename || device.name,
              deviceType: device.devicetype || device.type,
              groupId: group.groupid || group.id,
              groupName: group.groupname || group.name,
              lastActiveTime: device.lastactivetime || device.last_active_time,
              isActive: device.isfree === 1 || device.is_active === true,
              status: (device.isfree === 1 || device.is_active === true) ? 'active' : 'inactive',
              simNumber: device.simnum || device.sim_number,
              remark: device.remark
            });
          });
        }
      });
    }

    console.log('✅ Transformed data:', {
      deviceCount: transformedDevices.length,
      groupCount: transformedGroups.length
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        groups: transformedGroups,
        devices: transformedDevices || [],
        totalDevices: transformedDevices.length,
        totalGroups: transformedGroups.length
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('💥 Query monitor list error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to query monitor list',
        cause: error.message,
        groups: [],
        devices: []
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
}

async function handleGetPositions(body: any) {
  try {
    console.log('📍 Handling getpositions request');
    
    const { deviceIds } = body;
    const gp51Token = Deno.env.get('GP51_GLOBAL_API_TOKEN') || '6c1f1207c35d97a744837a19663ecdbe';
    
    // For now, return empty positions as this requires additional GP51 API implementation
    return new Response(
      JSON.stringify({ 
        success: true,
        positions: []
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('💥 Get positions error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to get positions',
        positions: []
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
}

async function handleHealthCheck(body: any) {
  try {
    console.log('🏥 Handling health check request');
    
    // Simple health check - verify GP51 API is reachable
    const gp51Token = Deno.env.get('GP51_GLOBAL_API_TOKEN') || '6c1f1207c35d97a744837a19663ecdbe';
    const startTime = Date.now();
    
    try {
      const testResponse = await fetch(`https://www.gps51.com/webapi?action=querymonitorlist&token=${gp51Token}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Envio-Fleet-GP51-Integration/1.0'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      return new Response(
        JSON.stringify({ 
          success: true,
          status: 'healthy',
          responseTime,
          activeDevices: 0,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
      
    } catch (healthError) {
      const responseTime = Date.now() - startTime;
      
      return new Response(
        JSON.stringify({ 
          success: false,
          status: 'unhealthy',
          responseTime,
          error: healthError.message,
          activeDevices: 0,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

  } catch (error) {
    console.error('💥 Health check error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        status: 'unhealthy',
        error: error.message,
        activeDevices: 0,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
}
