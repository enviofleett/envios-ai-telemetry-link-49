
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { gp51ApiClient } from '../_shared/gp51_api_client_unified.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface DeviceRegistrationRequest {
  action: 'add_device' | 'check_device';
  deviceid: string;
  devicename?: string;
  devicetype?: number;
  groupid?: string;
  username?: string;
}

serve(async (req) => {
  console.log(`🚛 GP51 Device Registration: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: DeviceRegistrationRequest = await req.json();
    const { action, deviceid, devicename, devicetype = 1, groupid = '0', username } = body;

    console.log(`🔧 GP51 Device Registration action: ${action} for device: ${deviceid}`);

    // Get current GP51 session
    const { data: sessionData, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !sessionData) {
      console.error('❌ No active GP51 session found:', sessionError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No active GP51 session. Please authenticate first.',
          errorCode: 'NO_SESSION'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session is expired
    const expiresAt = new Date(sessionData.token_expires_at);
    const now = new Date();
    if (expiresAt <= now) {
      console.error('❌ GP51 session expired');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 session expired. Please re-authenticate.',
          errorCode: 'SESSION_EXPIRED'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const session = {
      gp51_token: sessionData.gp51_token,
      username: sessionData.username
    };

    switch (action) {
      case 'check_device':
        return await handleCheckDevice(deviceid, session);
      
      case 'add_device':
        if (!devicename) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Device name is required for device creation',
              errorCode: 'MISSING_DEVICE_NAME'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return await handleAddDevice(deviceid, devicename, devicetype, groupid, username, session);
      
      default:
        console.error(`❌ Unknown action: ${action}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown action: ${action}`,
            errorCode: 'INVALID_ACTION'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('❌ GP51 Device Registration error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error during device registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleCheckDevice(deviceid: string, session: any) {
  try {
    console.log(`🔍 Checking device availability: ${deviceid}`);

    // Call GP51 API to check if device exists
    const result = await gp51ApiClient.callAction('querydevicedetail', {
      token: session.gp51_token,
      username: session.username,
      deviceid: deviceid
    });

    // If device is found, it's not available for registration
    const available = !result || result.status !== 0;

    console.log(`✅ Device ${deviceid} availability check complete: ${available ? 'available' : 'not available'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        available: available,
        deviceid: deviceid
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ Device availability check failed for ${deviceid}:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to check device availability',
        errorCode: 'AVAILABILITY_CHECK_FAILED'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleAddDevice(deviceid: string, devicename: string, devicetype: number, groupid: string, username: string | undefined, session: any) {
  try {
    console.log(`🚛 Adding device to GP51: ${deviceid} (${devicename})`);

    // Prepare parameters for GP51 adddevice action
    const addDeviceParams = {
      token: session.gp51_token,
      username: session.username,
      deviceid: deviceid,
      devicename: devicename,
      devicetype: devicetype,
      groupid: groupid
    };

    // Add username if provided for assignment
    if (username) {
      addDeviceParams.assignedusername = username;
    }

    console.log(`📤 GP51 adddevice parameters:`, {
      ...addDeviceParams,
      token: '[REDACTED]'
    });

    // Call GP51 API to add device
    const result = await gp51ApiClient.callAction('adddevice', addDeviceParams);

    console.log(`📊 GP51 adddevice response:`, result);

    // Check if the device was added successfully
    if (result && result.status === 0) {
      console.log(`✅ Device ${deviceid} added successfully to GP51`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          gp51DeviceId: deviceid,
          devicename: devicename,
          message: 'Device added successfully to GP51'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorMsg = result?.cause || result?.message || 'Unknown GP51 error';
      console.error(`❌ GP51 device addition failed:`, errorMsg);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `GP51 device addition failed: ${errorMsg}`,
          errorCode: 'GP51_ADD_DEVICE_FAILED'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error(`❌ Device addition failed for ${deviceid}:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to add device to GP51',
        details: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'DEVICE_ADDITION_FAILED'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
