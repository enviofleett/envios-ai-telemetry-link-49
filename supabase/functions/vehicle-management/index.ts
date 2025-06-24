
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface VehicleRegistrationRequest {
  action: 'register_vehicle';
  deviceId: string;
  deviceName: string;
  deviceType?: number;
  userId?: string;
  simNumber?: string;
  groupId?: string;
  enableGP51Integration?: boolean;
}

serve(async (req) => {
  console.log(`🚗 Vehicle Management: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: VehicleRegistrationRequest = await req.json();
    const { 
      action, 
      deviceId, 
      deviceName, 
      deviceType = 1, 
      userId, 
      simNumber, 
      groupId = '0',
      enableGP51Integration = true 
    } = body;

    console.log(`🔧 Vehicle Management action: ${action} for device: ${deviceId}`);

    if (action === 'register_vehicle') {
      return await handleVehicleRegistration({
        deviceId,
        deviceName,
        deviceType,
        userId,
        simNumber,
        groupId,
        enableGP51Integration,
        createdBy: user.id
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Vehicle Management error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleVehicleRegistration(params: {
  deviceId: string;
  deviceName: string;
  deviceType: number;
  userId?: string;
  simNumber?: string;
  groupId: string;
  enableGP51Integration: boolean;
  createdBy: string;
}) {
  const { deviceId, deviceName, deviceType, userId, simNumber, groupId, enableGP51Integration, createdBy } = params;

  try {
    console.log(`🚗 Registering vehicle: ${deviceId} (${deviceName})`);

    let gp51Result = null;

    // Step 1: Register device with GP51 if integration is enabled
    if (enableGP51Integration) {
      console.log(`🔗 GP51 integration enabled, registering device with GP51...`);
      
      const { data: gp51Data, error: gp51Error } = await supabase.functions.invoke('gp51-device-registration', {
        body: {
          action: 'add_device',
          deviceid: deviceId,
          devicename: deviceName,
          devicetype: deviceType,
          groupid: groupId
        }
      });

      if (gp51Error) {
        console.error('❌ GP51 device registration failed:', gp51Error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `GP51 device registration failed: ${gp51Error.message}`,
            errorCode: 'GP51_REGISTRATION_FAILED'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!gp51Data.success) {
        console.error('❌ GP51 device registration unsuccessful:', gp51Data.error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `GP51 device registration failed: ${gp51Data.error}`,
            errorCode: 'GP51_REGISTRATION_FAILED'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      gp51Result = gp51Data;
      console.log('✅ Device registered with GP51 successfully');
    }

    // Step 2: Create vehicle in local database
    const vehicleData = {
      gp51_device_id: deviceId,
      name: deviceName,
      user_id: userId || null,
      sim_number: simNumber || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: vehicleResult, error: vehicleError } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single();

    if (vehicleError) {
      console.error('❌ Database vehicle creation failed:', vehicleError);
      
      // If local creation fails but GP51 succeeded, we should note this
      if (gp51Result) {
        console.warn('⚠️ Vehicle created in GP51 but failed in local database');
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database vehicle creation failed: ${vehicleError.message}`,
          errorCode: 'DATABASE_CREATION_FAILED',
          gp51Result: gp51Result
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Vehicle created in database successfully');

    // Step 3: Log the registration
    console.log(`📝 Logging vehicle registration: ${deviceId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        vehicleId: vehicleResult.id,
        gp51DeviceId: deviceId,
        message: 'Vehicle registered successfully',
        gp51Integration: enableGP51Integration,
        gp51Result: gp51Result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Vehicle registration error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Vehicle registration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'REGISTRATION_ERROR'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
