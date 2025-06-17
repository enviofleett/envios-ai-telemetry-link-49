
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Inlined type definitions from gp51_data_processor.ts
export interface GP51DeviceData {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum?: string;
  creater: string;
  lastactivetime?: number;
  isfree: number;
  allowedit: number;
  overduetime: number;
  expirenotifytime: number;
  remark?: string;
  icon?: number;
  loginname?: string;
}

export interface ProcessedVehicleData {
  device_id: string;
  device_name: string;
  user_id: string;
  sim_number?: string;
  is_active: boolean;
  gp51_metadata: any;
  status: 'online' | 'offline' | 'unknown';
  created_at: string;
  updated_at: string;
}

// Inlined utility functions from gp51_data_processor.ts
function processGP51DeviceData(
  devices: GP51DeviceData[], 
  userId: string
): ProcessedVehicleData[] {
  const now = new Date().toISOString();
  
  return devices.map((device) => {
    // Determine device status based on GP51 data
    let status: 'online' | 'offline' | 'unknown' = 'unknown';
    
    if (device.lastactivetime) {
      const lastActive = new Date(device.lastactivetime * 1000);
      const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
      status = hoursSinceActive < 1 ? 'online' : 'offline';
    }
    
    return {
      device_id: device.deviceid,
      device_name: device.devicename || `Device ${device.deviceid}`,
      user_id: userId,
      sim_number: device.simnum || null,
      is_active: device.isfree !== 0, // GP51: isfree 0 usually means inactive/expired
      gp51_metadata: device,
      status,
      created_at: now,
      updated_at: now
    };
  });
}

function validateGP51Response(response: any): boolean {
  return (
    response &&
    typeof response.status === 'number' &&
    typeof response.cause === 'string' &&
    (response.status === 0 || response.cause !== 'OK')
  );
}

function extractDevicesFromGroups(groups: any[]): GP51DeviceData[] {
  const allDevices: GP51DeviceData[] = [];
  
  for (const group of groups) {
    if (group.devices && Array.isArray(group.devices)) {
      allDevices.push(...group.devices);
    }
  }
  
  return allDevices;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 GP51 Live Import function called');
    console.log('📋 Starting comprehensive vehicle data import from GP51...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Retrieve GP51 Token from gp51_sessions table
    console.log('1️⃣ Retrieving active GP51 session token...');
    
    const { data: gp51Sessions, error: sessionFetchError } = await supabase
      .from('gp51_sessions')
      .select('gp51_token, token_expires_at, username, envio_user_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionFetchError) {
      console.error('❌ Database error fetching GP51 session:', sessionFetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to retrieve GP51 session from database',
          details: sessionFetchError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!gp51Sessions || gp51Sessions.length === 0) {
      console.log('📝 No GP51 sessions found - GP51 not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 integration not configured. Please authenticate in admin settings.',
          code: 'NO_GP51_CONFIG'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const session = gp51Sessions[0];
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      console.error('❌ GP51 session expired:', { expiresAt, now });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 session expired. Please re-authenticate in admin settings.',
          code: 'SESSION_EXPIRED'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ GP51 session token retrieved for user: ${session.username}`);
    console.log(`🔑 Token expires at: ${expiresAt.toISOString()}`);

    // Step 2: Call GP51 API to get device/vehicle data
    console.log('2️⃣ Fetching device list from GP51 API...');
    
    const apiUrl = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com/webapi';
    const requestUrl = `${apiUrl}?action=querymonitorlist&token=${session.gp51_token}&username=${session.username}`;
    
    console.log(`📡 Making request to: ${apiUrl}?action=querymonitorlist&username=${session.username}`);

    let gp51Response: any;
    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      gp51Response = await response.json();
      console.log(`📊 GP51 API response status: ${gp51Response.status}`);
      
      if (!validateGP51Response(gp51Response) || gp51Response.status !== 0) {
        console.error('❌ GP51 API returned error status:', gp51Response);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `GP51 API error: ${gp51Response.cause || 'Unknown error'}`,
            gp51Status: gp51Response.status
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

    } catch (apiError) {
      console.error('❌ Error calling GP51 API:', apiError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch from GP51 API: ${apiError.message}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 3: Process and transform GP51 data
    console.log('3️⃣ Processing GP51 device data...');
    
    const totalGroups = gp51Response.groups?.length || 0;
    console.log(`📦 Processing ${totalGroups} device groups...`);
    
    const allDevices: GP51DeviceData[] = gp51Response.groups ? 
      extractDevicesFromGroups(gp51Response.groups) : [];

    console.log(`🔢 Total devices found: ${allDevices.length}`);

    if (allDevices.length === 0) {
      console.log('📝 No devices found in GP51 response');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No vehicles found in GP51 account',
          data: {
            totalDevices: 0,
            totalGroups,
            importedVehicles: 0,
            username: session.username,
            timestamp: new Date().toISOString()
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 4: Transform data for Supabase using utility function
    console.log('4️⃣ Transforming data for database import...');
    
    const vehiclesToImport = processGP51DeviceData(allDevices, session.envio_user_id);
    console.log(`📝 Prepared ${vehiclesToImport.length} vehicle records for import`);

    // Step 5: Upsert data into vehicles table
    console.log('5️⃣ Importing vehicles into database...');
    
    const { data: importedVehicles, error: importError } = await supabase
      .from('vehicles')
      .upsert(vehiclesToImport as any[], { 
        onConflict: 'device_id',
        ignoreDuplicates: false 
      })
      .select();

    if (importError) {
      console.error('❌ Database import error:', importError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to import vehicles: ${importError.message}`,
          details: importError
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const importedCount = importedVehicles?.length || 0;
    console.log(`✅ Successfully imported ${importedCount} vehicles`);

    // Step 6: Return success response with detailed statistics
    console.log('📊 Import completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Vehicle import completed successfully. Imported ${importedCount} vehicles from ${totalGroups} groups.`,
        data: {
          totalDevices: allDevices.length,
          totalGroups,
          importedVehicles: importedCount,
          username: session.username,
          timestamp: new Date().toISOString(),
          fetched_at: new Date().toISOString()
        }
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Fatal error in GP51 Live Import:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Fatal import error: ${error.message}`,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
