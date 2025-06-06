
import { authenticateWithGP51 } from './gp51-auth.ts';
import { saveGP51Session, getGP51Status } from './database.ts';
import { createResponse } from './cors.ts';
import { createEnhancedGP51Service } from './enhanced-gp51-service.ts';
import type { GP51Credentials } from './types.ts';

export async function handleSaveCredentialsWithVehicleImport(credentials: GP51Credentials & { apiUrl?: string }) {
  const trimmedUsername = credentials.username?.trim();
  const trimmedPassword = credentials.password?.trim();
  const trimmedApiUrl = credentials.apiUrl?.trim();
  
  console.log('Processing enhanced GP51 credentials save with vehicle import for user:', trimmedUsername);
  
  if (!trimmedUsername || !trimmedPassword) {
    console.error('Missing credentials: username or password not provided');
    return createResponse(
      { error: 'Username and password are required' },
      400
    );
  }

  try {
    // Step 1: Get API URL from existing configuration or user input
    let finalApiUrl = trimmedApiUrl;
    if (!finalApiUrl) {
      finalApiUrl = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    }
    
    console.log('Step 1: Using GP51 API URL:', finalApiUrl);

    // Step 2: Authenticate with GP51 using enhanced service
    console.log('Step 2: Authenticating with enhanced GP51 service...');
    const gp51Service = await createEnhancedGP51Service(finalApiUrl);
    const authResult = await gp51Service.authenticate(trimmedUsername, trimmedPassword);
    
    if (!authResult.success) {
      throw new Error(authResult.error || 'Authentication failed');
    }

    // Step 3: Save session to database
    console.log('Step 3: Saving GP51 session to database...');
    await saveGP51Session(trimmedUsername, authResult.token!, finalApiUrl);

    // Step 4: Fetch vehicles using proven patterns
    console.log('Step 4: Fetching vehicles using enhanced service...');
    const vehiclesResult = await gp51Service.fetchVehicles();
    
    let vehicleImportResults = {
      vehiclesFetched: 0,
      vehiclesImported: 0,
      importErrors: [] as string[]
    };

    if (vehiclesResult.success && vehiclesResult.vehicles) {
      console.log(`Step 5: Enriching ${vehiclesResult.vehicles.length} vehicles with positions...`);
      const enrichedVehicles = await gp51Service.enrichWithPositions(vehiclesResult.vehicles);
      
      console.log(`Step 6: Importing ${enrichedVehicles.length} vehicles to database...`);
      const importResult = await importVehiclesToSupabaseEnhanced(enrichedVehicles, trimmedUsername);
      vehicleImportResults = {
        vehiclesFetched: enrichedVehicles.length,
        vehiclesImported: importResult.imported,
        importErrors: importResult.errors
      };
    } else {
      console.warn('Vehicle fetching failed:', vehiclesResult.error);
      vehicleImportResults.importErrors.push(vehiclesResult.error || 'Failed to fetch vehicles');
    }

    console.log('Enhanced GP51 credentials successfully validated, session saved, and vehicles imported');
    return createResponse({
      success: true,
      message: 'GP51 credentials validated and vehicles imported successfully!',
      username: trimmedUsername,
      apiUrl: finalApiUrl,
      tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      vehicleImport: vehicleImportResults
    });

  } catch (error) {
    console.error('Enhanced GP51 credential validation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return createResponse({
      error: 'Enhanced GP51 Connection Failed',
      details: errorMessage,
      username: trimmedUsername
    }, 500);
  }
}

async function importVehiclesToSupabaseEnhanced(vehicles: any[], username: string): Promise<{
  imported: number;
  errors: string[];
}> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    return { imported: 0, errors: ['Supabase configuration missing'] };
  }

  let imported = 0;
  const errors: string[] = [];

  // Process vehicles in smaller batches for better reliability
  const batchSize = 50;
  for (let i = 0; i < vehicles.length; i += batchSize) {
    const batch = vehicles.slice(i, i + batchSize);
    
    try {
      const batchResult = await processBatch(batch, username, supabaseUrl, supabaseKey);
      imported += batchResult.imported;
      errors.push(...batchResult.errors);
    } catch (batchError) {
      console.error(`Batch ${i}-${i + batchSize} failed:`, batchError);
      // Fall back to individual processing for this batch
      const individualResult = await processIndividually(batch, username, supabaseUrl, supabaseKey);
      imported += individualResult.imported;
      errors.push(...individualResult.errors);
    }
  }

  return { imported, errors };
}

async function processBatch(vehicles: any[], username: string, supabaseUrl: string, supabaseKey: string): Promise<{
  imported: number;
  errors: string[];
}> {
  const vehicleData = vehicles.map(vehicle => prepareVehicleData(vehicle, username));
  
  const response = await fetch(`${supabaseUrl}/rest/v1/vehicles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(vehicleData)
  });

  if (response.ok) {
    console.log(`Successfully imported batch of ${vehicles.length} vehicles`);
    return { imported: vehicles.length, errors: [] };
  } else {
    const errorText = await response.text();
    throw new Error(`Batch import failed: ${errorText}`);
  }
}

async function processIndividually(vehicles: any[], username: string, supabaseUrl: string, supabaseKey: string): Promise<{
  imported: number;
  errors: string[];
}> {
  let imported = 0;
  const errors: string[] = [];

  for (const vehicle of vehicles) {
    try {
      const vehicleData = prepareVehicleData(vehicle, username);

      const response = await fetch(`${supabaseUrl}/rest/v1/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(vehicleData)
      });

      if (response.ok) {
        imported++;
        console.log(`Successfully imported vehicle: ${vehicle.devicename} (${vehicle.deviceid})`);
      } else {
        const errorText = await response.text();
        console.error(`Failed to import vehicle ${vehicle.deviceid}:`, errorText);
        errors.push(`Vehicle ${vehicle.deviceid}: ${errorText}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error importing vehicle ${vehicle.deviceid}:`, errorMsg);
      errors.push(`Vehicle ${vehicle.deviceid}: ${errorMsg}`);
    }
  }

  return { imported, errors };
}

function prepareVehicleData(vehicle: any, username: string) {
  const now = new Date().toISOString();
  
  return {
    device_id: vehicle.deviceid.toString(),
    device_name: vehicle.devicename || `Device ${vehicle.deviceid}`,
    device_type: vehicle.devicetype || 'unknown', // Now properly mapped to the device_type column
    group_id: vehicle.groupid,
    gp51_username: username, // Critical for user-vehicle association
    device_status: vehicle.devicestatus,
    overdue_time: vehicle.overduetime,
    timezone: vehicle.timezone,
    icon_type: vehicle.icontype,
    offline_delay: vehicle.offline_delay,
    last_update: vehicle.lastupdate,
    latitude: vehicle.lat,
    longitude: vehicle.lng,
    speed: vehicle.speed,
    course: vehicle.course,
    acc_status: vehicle.acc,
    oil_level: vehicle.oil,
    temperature: vehicle.temperature,
    gsm_signal: vehicle.gsm,
    gps_signal: vehicle.gps,
    last_position: vehicle.lastPosition ? JSON.stringify(vehicle.lastPosition) : null,
    is_active: true,
    created_at: now,
    updated_at: now
  };
}

export async function handleHealthCheck() {
  console.log('Performing enhanced GP51 health check');
  
  try {
    // Get current GP51 status
    const status = await getGP51Status();
    
    if (!status.connected) {
      return createResponse({
        status: 'disconnected',
        healthy: false,
        details: 'GP51 not connected',
        error: status.error
      });
    }

    // Get API URL from session or environment
    const apiUrl = status.apiUrl || Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    
    // Create enhanced service and perform health check
    const gp51Service = await createEnhancedGP51Service(apiUrl);
    const healthResult = await gp51Service.performHealthCheck();

    return createResponse({
      status: healthResult.status,
      healthy: healthResult.success,
      details: {
        gp51Connected: status.connected,
        ...healthResult.details,
        username: status.username,
        expiresAt: status.expiresAt
      },
      error: healthResult.error
    });
    
  } catch (error) {
    console.error('Enhanced health check error:', error);
    return createResponse({
      status: 'error',
      healthy: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    }, 500);
  }
}
