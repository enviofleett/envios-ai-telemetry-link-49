
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
    
    if (!body.username || !body.password) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Username and password required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // MD5 hash the password for GP51 API
    const encoder = new TextEncoder();
    const data = encoder.encode(body.password);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const gp51Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();

    // ✅ CORRECT: Using official GP51 API format with GET and query parameters
    const queryUrl = `https://www.gps51.com/webapi?action=querymonitorlist&username=${encodeURIComponent(body.username)}&password=${encodeURIComponent(gp51Hash)}`;
    
    console.log('🔍 Querying device list for user:', body.username);
    console.log('🌐 Query URL (sanitized):', queryUrl.replace(gp51Hash, '***'));

    const gp51Response = await fetch(queryUrl, {
      method: 'GET',  // Official GP51 API uses GET
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ-GP51-Integration/1.0'
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    console.log('📡 GP51 Response Status:', gp51Response.status);

    if (!gp51Response.ok) {
      throw new Error(`HTTP ${gp51Response.status}: ${gp51Response.statusText}`);
    }

    const responseText = await gp51Response.text();
    console.log('📄 Response Length:', responseText.length);

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
          error: `GP51 API Error: ${deviceData.cause || 'Unknown error'}`,
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
