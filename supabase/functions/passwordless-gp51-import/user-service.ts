
import { GP51Vehicle, UserImportResult } from './types.ts';
import { getMonitorListForUser, enrichWithPositions } from './gp51-api.ts';

export async function importUserPasswordless(
  gp51Username: string, 
  adminToken: string, 
  jobId: string, 
  supabase: any
): Promise<UserImportResult> {
  try {
    console.log(`Starting import for user: ${gp51Username}`);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('envio_users')
      .select('id, gp51_username')
      .eq('gp51_username', gp51Username)
      .single();

    if (existingUser) {
      console.log(`User ${gp51Username} already exists with ID: ${existingUser.id}`);
      throw new Error('User already imported');
    }

    console.log(`Fetching vehicles for ${gp51Username}...`);
    // Get vehicles for this user using admin token
    const vehicles = await getMonitorListForUser(gp51Username, adminToken);
    
    if (!vehicles || vehicles.length === 0) {
      console.warn(`No vehicles found for user ${gp51Username}`);
      // Still create the user even if no vehicles
    }

    console.log(`Found ${vehicles.length} vehicles for ${gp51Username}, enriching with positions...`);
    // Get positions for vehicles (non-blocking)
    const vehiclesWithPositions = await enrichWithPositions(vehicles, adminToken);
    
    console.log(`Creating Envio user for ${gp51Username}...`);
    // Create Envio user with temporary password
    const tempPassword = generateTempPassword();
    const envioUser = await createEnvioUser(gp51Username, tempPassword, supabase);
    
    console.log(`Storing ${vehiclesWithPositions.length} vehicles for user ${gp51Username}...`);
    // Store vehicles linked to this user
    await storeVehiclesForUser(vehiclesWithPositions, gp51Username, envioUser.id, jobId, supabase);

    console.log(`Successfully imported user ${gp51Username} with ${vehiclesWithPositions.length} vehicles`);
    return {
      gp51_username: gp51Username,
      envio_user_id: envioUser.id,
      vehicles_count: vehiclesWithPositions.length,
      success: true
    };

  } catch (error) {
    console.error(`Failed to import user ${gp51Username}:`, error);
    return {
      gp51_username: gp51Username,
      vehicles_count: 0,
      success: false,
      error: error.message
    };
  }
}

export async function createEnvioUser(gp51Username: string, tempPassword: string, supabase: any) {
  console.log(`Creating auth user for ${gp51Username}...`);
  
  // Generate a temporary email for the user
  const tempEmail = `${gp51Username}@temp.gp51import.local`;
  
  try {
    // Create user in Supabase Auth with temporary password
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        gp51_username: gp51Username,
        import_source: 'passwordless_import'
      }
    });

    if (authError) {
      console.error(`Auth user creation failed for ${gp51Username}:`, authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    console.log(`Auth user created for ${gp51Username}, ID: ${authUser.user.id}`);

    // Create user in envio_users table
    const { data: envioUser, error: envioError } = await supabase
      .from('envio_users')
      .insert({
        id: authUser.user.id,
        name: gp51Username,
        email: tempEmail,
        gp51_username: gp51Username,
        is_gp51_imported: true,
        needs_password_set: true,
        import_source: 'passwordless_import',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (envioError) {
      console.error(`Envio user creation failed for ${gp51Username}:`, envioError);
      // Cleanup auth user if envio user creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create envio user: ${envioError.message}`);
    }

    console.log(`Envio user created for ${gp51Username}, ID: ${envioUser.id}`);
    return envioUser;

  } catch (error) {
    console.error(`User creation failed for ${gp51Username}:`, error);
    throw error;
  }
}

export async function storeVehiclesForUser(
  vehicles: GP51Vehicle[], 
  gp51Username: string, 
  envioUserId: string,
  jobId: string, 
  supabase: any
): Promise<void> {
  console.log(`Storing ${vehicles.length} vehicles for ${gp51Username}...`);

  if (!vehicles || vehicles.length === 0) {
    console.log(`No vehicles to store for ${gp51Username}`);
    return;
  }

  for (const vehicle of vehicles) {
    try {
      const vehicleData = {
        device_id: vehicle.deviceid,
        device_name: vehicle.devicename || `Device ${vehicle.deviceid}`,
        envio_user_id: envioUserId,
        gp51_username: gp51Username,
        sim_number: vehicle.simnum || null,
        status: vehicle.status || 'unknown',
        last_position: vehicle.lastPosition || null,
        gp51_metadata: {
          simnum: vehicle.simnum,
          lastactivetime: vehicle.lastactivetime,
          original_data: vehicle,
          import_job_id: jobId
        },
        import_job_type: 'passwordless_import',
        is_active: true,
        created_at: new Date().toISOString()
      };

      const { error: vehicleError } = await supabase
        .from('vehicles')
        .upsert(vehicleData, { 
          onConflict: 'device_id',
          ignoreDuplicates: false 
        });

      if (vehicleError) {
        console.error(`Failed to store vehicle ${vehicle.deviceid}:`, vehicleError);
        // Don't throw, just log and continue with other vehicles
      } else {
        console.log(`Successfully stored vehicle ${vehicle.deviceid} for ${gp51Username}`);
      }

    } catch (error) {
      console.error(`Failed to process vehicle ${vehicle.deviceid}:`, error);
      // Continue with other vehicles
    }
  }

  console.log(`Completed storing vehicles for ${gp51Username}`);
}

export function generateTempPassword(): string {
  // Generate a more secure temporary password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = 'Temp_';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
