
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getGP51ApiUrl, isValidGP51BaseUrl } from '../_shared/constants.ts';
import { md5_for_gp51_only, checkRateLimit, sanitizeInput } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`📥 [GP51-LIVE-IMPORT] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Rate limiting for live import operations
  if (!checkRateLimit(clientIP, 5, 60 * 1000)) { // 5 requests per minute
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Too many live import requests. Please try again later.' 
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { username, password, apiUrl } = body;

    console.log(`🚀 [GP51-LIVE-IMPORT] Starting live import for user: ${username?.substring(0, 3)}***`);

    // Use standardized URL construction
    const gp51BaseUrl = apiUrl || Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
    const gp51ApiUrl = getGP51ApiUrl(gp51BaseUrl);
    
    console.log(`🌐 [GP51-LIVE-IMPORT] Using API URL: ${gp51ApiUrl}`);
    
    // Validate the base URL if provided
    if (apiUrl && !isValidGP51BaseUrl(apiUrl)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid GP51 base URL provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 1: Authenticate with GP51
    const authResult = await authenticateWithGP51(gp51ApiUrl, username, password);
    if (!authResult.success) {
      console.error('❌ [GP51-LIVE-IMPORT] Authentication failed:', authResult.error);
      return new Response(
        JSON.stringify(authResult),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ [GP51-LIVE-IMPORT] Authentication successful');

    // Step 2: Fetch vehicles from GP51
    const vehiclesResult = await fetchVehiclesFromGP51(gp51ApiUrl, authResult.token);
    if (!vehiclesResult.success) {
      console.error('❌ [GP51-LIVE-IMPORT] Failed to fetch vehicles:', vehiclesResult.error);
      return new Response(
        JSON.stringify(vehiclesResult),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`📦 [GP51-LIVE-IMPORT] Fetched ${vehiclesResult.vehicles.length} vehicles`);

    // Step 3: Process and import vehicles (simplified for this implementation)
    const importResults = await processVehicleImport(supabase, vehiclesResult.vehicles);

    console.log(`✅ [GP51-LIVE-IMPORT] Import completed: ${importResults.imported} imported, ${importResults.skipped} skipped`);

    return new Response(JSON.stringify({
      success: true,
      imported: importResults.imported,
      skipped: importResults.skipped,
      total: vehiclesResult.vehicles.length,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [GP51-LIVE-IMPORT] Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Live import failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function authenticateWithGP51(apiUrl: string, username: string, password: string) {
  try {
    console.log('🔐 [GP51-LIVE-IMPORT] Authenticating with GP51...');
    
    const hashedPassword = await md5_for_gp51_only(password);
    
    const loginUrl = new URL(apiUrl);
    loginUrl.searchParams.set('action', 'login');
    loginUrl.searchParams.set('username', sanitizeInput(username));
    loginUrl.searchParams.set('password', hashedPassword);
    loginUrl.searchParams.set('from', 'WEB');
    loginUrl.searchParams.set('type', 'USER');

    const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    if (globalToken) {
      loginUrl.searchParams.set('token', globalToken);
    }

    const response = await fetch(loginUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'EnvioFleet/1.0/LiveImport'
      },
      signal: AbortSignal.timeout(10000)
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`GP51 API Error: ${response.status} - ${responseText}`);
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { token: responseText.trim(), status: responseText.trim() ? 0 : 1 };
    }

    if (responseData.status === 0 || (responseData.token && responseData.token.length > 0)) {
      return {
        success: true,
        token: responseData.token || responseText.trim()
      };
    } else {
      return {
        success: false,
        error: responseData.cause || responseData.message || 'Authentication failed'
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication error'
    };
  }
}

async function fetchVehiclesFromGP51(apiUrl: string, token: string) {
  try {
    console.log('🚗 [GP51-LIVE-IMPORT] Fetching vehicles from GP51...');
    
    const vehiclesUrl = new URL(apiUrl);
    vehiclesUrl.searchParams.set('action', 'querymonitorlist');
    vehiclesUrl.searchParams.set('token', token);

    const response = await fetch(vehiclesUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0/LiveImport'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`GP51 API Error: ${response.status}`);
    }

    const responseData = await response.json();
    
    if (responseData.status === 0) {
      // Extract vehicles from groups structure
      const vehicles = [];
      if (responseData.groups && Array.isArray(responseData.groups)) {
        for (const group of responseData.groups) {
          if (group.devices && Array.isArray(group.devices)) {
            vehicles.push(...group.devices);
          }
        }
      }

      return {
        success: true,
        vehicles: vehicles
      };
    } else {
      return {
        success: false,
        error: responseData.cause || 'Failed to fetch vehicles'
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch vehicles'
    };
  }
}

async function processVehicleImport(supabase: any, vehicles: any[]) {
  let imported = 0;
  let skipped = 0;

  for (const vehicle of vehicles) {
    try {
      const vehicleData = {
        gp51_device_id: sanitizeInput(vehicle.deviceid?.toString() || ''),
        make: sanitizeInput(vehicle.devicename || 'Unknown'),
        model: 'GP51 Import',
        year: new Date().getFullYear(),
        license_plate: sanitizeInput(vehicle.simnum || ''),
        status: vehicle.devicestatus === 1 ? 'active' : 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (!vehicleData.gp51_device_id) {
        skipped++;
        continue;
      }

      // Check if vehicle already exists
      const { data: existingVehicle } = await supabase
        .from('vehicles')
        .select('id')
        .eq('gp51_device_id', vehicleData.gp51_device_id)
        .single();

      if (existingVehicle) {
        // Update existing vehicle
        await supabase
          .from('vehicles')
          .update({
            make: vehicleData.make,
            status: vehicleData.status,
            updated_at: vehicleData.updated_at
          })
          .eq('gp51_device_id', vehicleData.gp51_device_id);
      } else {
        // Insert new vehicle
        await supabase
          .from('vehicles')
          .insert(vehicleData);
      }

      imported++;
    } catch (error) {
      console.error(`❌ [GP51-LIVE-IMPORT] Failed to process vehicle ${vehicle.deviceid}:`, error);
      skipped++;
    }
  }

  return { imported, skipped };
}
