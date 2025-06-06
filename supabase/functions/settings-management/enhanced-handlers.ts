
import { authenticateWithGP51 } from './gp51-auth.ts';
import { saveGP51Session, getGP51Status } from './database.ts';
import { createResponse } from './cors.ts';
import type { GP51Credentials } from './types.ts';

interface GP51Vehicle {
  deviceid: number;
  devicename: string;
  devicetype: number;
  groupid: number;
  username: string;
  devicestatus: number;
  overduetime: string;
  timezone: number;
  icontype: number;
  offline_delay: number;
  lastupdate: string;
  lat: number;
  lng: number;
  speed: number;
  course: number;
  acc: number;
  oil: number;
  temperature: number;
  gsm: number;
  gps: number;
}

export async function handleSaveCredentialsWithVehicleImport(credentials: GP51Credentials & { apiUrl?: string }) {
  const trimmedUsername = credentials.username?.trim();
  const trimmedPassword = credentials.password?.trim();
  const trimmedApiUrl = credentials.apiUrl?.trim();
  
  console.log('Processing GP51 credentials save with vehicle import for user:', trimmedUsername);
  
  if (!trimmedUsername || !trimmedPassword) {
    console.error('Missing credentials: username or password not provided');
    return createResponse(
      { error: 'Username and password are required' },
      400
    );
  }

  try {
    // Step 1: Authenticate with GP51
    console.log('Step 1: Authenticating with GP51...');
    const authResult = await authenticateWithGP51({ 
      username: trimmedUsername, 
      password: trimmedPassword,
      apiUrl: trimmedApiUrl
    });
    
    // Step 2: Save session to database
    console.log('Step 2: Saving GP51 session to database...');
    await saveGP51Session(authResult.username, authResult.token, authResult.apiUrl);

    // Step 3: Fetch vehicles from GP51
    console.log('Step 3: Fetching vehicles from GP51...');
    const vehiclesResult = await fetchVehiclesFromGP51(authResult.token, authResult.apiUrl || 'https://www.gps51.com');
    
    let vehicleImportResults = {
      vehiclesFetched: 0,
      vehiclesImported: 0,
      importErrors: [] as string[]
    };

    if (vehiclesResult.success && vehiclesResult.vehicles) {
      console.log(`Step 4: Importing ${vehiclesResult.vehicles.length} vehicles to database...`);
      const importResult = await importVehiclesToSupabase(vehiclesResult.vehicles, authResult.username);
      vehicleImportResults = {
        vehiclesFetched: vehiclesResult.vehicles.length,
        vehiclesImported: importResult.imported,
        importErrors: importResult.errors
      };
    }

    console.log('GP51 credentials successfully validated, session saved, and vehicles imported');
    return createResponse({
      success: true,
      message: 'GP51 credentials validated and saved successfully!',
      username: authResult.username,
      apiUrl: authResult.apiUrl,
      tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      vehicleImport: vehicleImportResults
    });

  } catch (error) {
    console.error('GP51 credential validation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return createResponse({
      error: 'GP51 Connection Failed',
      details: errorMessage,
      username: trimmedUsername
    }, 500);
  }
}

async function fetchVehiclesFromGP51(token: string, baseUrl: string): Promise<{
  success: boolean;
  vehicles?: GP51Vehicle[];
  error?: string;
}> {
  try {
    const cleanUrl = baseUrl.replace(/\/webapi\/?$/, '');
    const vehiclesUrl = `${cleanUrl}/webapi?action=getdevices&token=${token}`;
    
    console.log(`Fetching vehicles from: ${vehiclesUrl}`);
    
    const response = await fetch(vehiclesUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Fleet-Management-System/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Vehicles API response:', result);

    if (result.status === 0 && result.devicelist) {
      console.log(`Successfully fetched ${result.devicelist.length} vehicles`);
      return { success: true, vehicles: result.devicelist };
    } else {
      const errorMsg = result.cause || 'Failed to fetch vehicles';
      console.error(`GP51 vehicles fetch failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error('GP51 vehicles fetch error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown vehicles fetch error' 
    };
  }
}

async function importVehiclesToSupabase(vehicles: GP51Vehicle[], username: string): Promise<{
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

  for (const vehicle of vehicles) {
    try {
      const vehicleData = {
        device_id: vehicle.deviceid.toString(),
        device_name: vehicle.devicename || `Device ${vehicle.deviceid}`,
        device_type: vehicle.devicetype,
        group_id: vehicle.groupid,
        gp51_username: username,
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
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

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

export async function handleHealthCheck() {
  console.log('Performing GP51 health check');
  
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

    // If connected, test vehicle fetch capability
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return createResponse({
        status: 'configuration_error',
        healthy: false,
        details: 'Supabase configuration missing'
      });
    }

    // Check database connectivity
    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/vehicles?select=id&limit=1`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });

    const dbHealthy = dbResponse.ok;

    return createResponse({
      status: 'healthy',
      healthy: true,
      details: {
        gp51Connected: status.connected,
        databaseAccessible: dbHealthy,
        username: status.username,
        expiresAt: status.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    return createResponse({
      status: 'error',
      healthy: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    }, 500);
  }
}
