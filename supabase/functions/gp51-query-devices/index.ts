
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
    console.log(`[${new Date().toISOString()}] GP51 Device List Query`);

    const body = await req.json();
    
    if (!body.token || !body.username) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token and username required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Step 1: Query Monitor List (from API doc section 5)
    const queryUrl = `https://www.gps51.com/webapi?action=querymonitorlist&token=${body.token}`;
    
    console.log('🔍 Querying device list for user:', body.username);
    console.log('🌐 Query URL:', queryUrl);

    const gp51Response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Envio-Fleet-GP51-Integration/1.0'
      },
      body: JSON.stringify({
        username: body.username  // Required parameter from API doc
      })
    });

    console.log('📡 GP51 Response Status:', gp51Response.status);

    const responseText = await gp51Response.text();
    console.log('📄 Response Length:', responseText.length);
    console.log('📄 Response Preview:', responseText.substring(0, 300));

    if (!responseText) {
      throw new Error('Empty response from GP51');
    }

    let deviceData;
    try {
      deviceData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }

    console.log('📊 Parsed Device Data:', {
      status: deviceData.status,
      cause: deviceData.cause,
      groupCount: deviceData.groups?.length || 0
    });

    // Check API response status (0 = success, 1 = failed)
    if (deviceData.status !== 0) {
      console.error('❌ GP51 API Error:', deviceData.cause);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `GP51 API Error: ${deviceData.cause}`,
          data: [],
          groups: []
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Transform GP51 data structure to our format
    const transformedGroups = [];
    const transformedDevices = [];
    let totalDeviceCount = 0;

    if (deviceData.groups && Array.isArray(deviceData.groups)) {
      deviceData.groups.forEach(group => {
        // Transform group data
        const transformedGroup = {
          id: group.groupid?.toString() || 'unknown',
          groupId: group.groupid,
          name: group.groupname || 'Unnamed Group',
          remark: group.remark || '',
          deviceCount: group.devices?.length || 0
        };
        transformedGroups.push(transformedGroup);

        // Transform device data from this group
        if (group.devices && Array.isArray(group.devices)) {
          group.devices.forEach(device => {
            const transformedDevice = {
              // Basic device info
              deviceId: device.deviceid,
              deviceName: device.devicename || 'Unnamed Device',
              deviceType: device.devicetype || 0,
              
              // Group association
              groupId: group.groupid,
              groupName: group.groupname,
              
              // Device status and activity
              lastActiveTime: device.lastactivetime || null,
              isActive: device.isfree === 1, // 1 = normal, 2+ = various issues
              status: device.isfree === 1 ? 'active' : 'inactive',
              statusCode: device.isfree,
              
              // Additional device details
              simNumber: device.simnum || '',
              remark: device.remark || '',
              createdBy: device.creater || '',
              allowEdit: device.allowedit === 1,
              isStared: device.stared === 1,
              icon: device.icon || 0,
              loginName: device.loginame || '',
              
              // Service and expiry info
              overdueTime: device.overduetime || null,
              expireNotifyTime: device.expirenotifytime || null,
              videChannelCount: device.videochannelcount || 0,
              
              // Calculated fields
              isOnline: device.lastactivetime && (Date.now() - device.lastactivetime) < 30 * 60 * 1000, // 30 min threshold
              daysSinceActive: device.lastactivetime ? Math.floor((Date.now() - device.lastactivetime) / (24 * 60 * 60 * 1000)) : null
            };
            
            transformedDevices.push(transformedDevice);
            totalDeviceCount++;
          });
        }
      });
    }

    console.log('✅ Data Transformation Complete:', {
      totalGroups: transformedGroups.length,
      totalDevices: totalDeviceCount,
      activeDevices: transformedDevices.filter(d => d.isActive).length,
      onlineDevices: transformedDevices.filter(d => d.isOnline).length
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        status: 'ok',
        data: transformedDevices,
        groups: transformedGroups,
        summary: {
          totalDevices: totalDeviceCount,
          totalGroups: transformedGroups.length,
          activeDevices: transformedDevices.filter(d => d.isActive).length,
          inactiveDevices: transformedDevices.filter(d => !d.isActive).length,
          onlineDevices: transformedDevices.filter(d => d.isOnline).length,
          offlineDevices: transformedDevices.filter(d => !d.isOnline).length
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('💥 Device Query Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Device query failed: ${error.message}`,
        data: [],
        groups: [],
        details: error.stack
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
