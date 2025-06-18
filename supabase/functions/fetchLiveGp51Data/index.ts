
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting Enhanced GP51 Live Data Import...');
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { forceFullSync = false, deviceids = '' } = await req.json().catch(() => ({}));

    // Get GP51 credentials from gp51_sessions table (using existing token)
    const { data: sessionData, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('username, gp51_token, api_url')
      .eq('username', 'octopus')
      .single();

    if (sessionError || !sessionData) {
      console.error('❌ No GP51 credentials found:', sessionError);
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 credentials not found for octopus user'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Found GP51 session for user:', sessionData.username);

    const apiUrl = sessionData.api_url || 'https://www.gps51.com/webapi';
    const token = sessionData.gp51_token;

    if (!token || token === 'pending_authentication') {
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 token not available or pending authentication'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let devices = [];
    let positions = [];
    let syncType = forceFullSync ? 'fullSync' : 'batchedUpdate';

    if (forceFullSync || !deviceids) {
      // Get device list using existing token
      console.log('📱 Fetching device list...');
      const deviceListUrl = `${apiUrl}/index.php?action=devicelist&token=${token}`;
      
      const deviceResponse = await fetch(deviceListUrl);
      const deviceResult = await deviceResponse.json();

      if (deviceResult.result === 'success' && deviceResult.data) {
        devices = deviceResult.data.map((device: any) => ({
          gp51_device_id: String(device.deviceid),
          name: device.devicename || `Device ${device.deviceid}`,
          sim_number: device.sim || null,
          last_position: null
        }));
        console.log(`✅ Retrieved ${devices.length} devices`);
      }

      // Get positions for all devices
      if (devices.length > 0) {
        console.log('📍 Fetching positions...');
        const deviceIds = devices.map(d => d.gp51_device_id).join(',');
        const positionUrl = `${apiUrl}/index.php?action=lastposition&token=${token}&deviceids=${deviceIds}`;
        
        const positionResponse = await fetch(positionUrl);
        const positionResult = await positionResponse.json();

        if (positionResult.result === 'success' && positionResult.data) {
          positions = positionResult.data;
          console.log(`✅ Retrieved ${positions.length} positions`);
        }
      }
    } else {
      // Batched update - get specific device positions
      console.log('📍 Fetching specific device positions...');
      const positionUrl = `${apiUrl}/index.php?action=lastposition&token=${token}&deviceids=${deviceids}`;
      
      const positionResponse = await fetch(positionUrl);
      const positionResult = await positionResponse.json();

      if (positionResult.result === 'success' && positionResult.data) {
        positions = positionResult.data;
        console.log(`✅ Retrieved ${positions.length} positions for batched update`);
        syncType = 'batchedUpdate';
      }
    }

    // Return structured data for processing
    const responseData = {
      success: true,
      data: {
        type: syncType,
        devices: devices,
        positions: positions,
        statistics: {
          totalDevices: devices.length,
          totalPositions: positions.length,
          responseTime: Date.now()
        },
        metadata: {
          fetchedAt: new Date().toISOString(),
          source: 'GP51',
          syncType: syncType
        }
      }
    };

    console.log(`✅ Data fetch complete: ${syncType} with ${devices.length} devices and ${positions.length} positions`);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ GP51 data fetch failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
