
import { GP51Vehicle, UserImportResult } from './types.ts';
import { getMonitorListForUser, enrichWithPositions } from './gp51-api.ts';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"

export async function importUserPasswordless(
  gp51Username: string, 
  adminToken: string, 
  jobId: string, 
  supabase: any
): Promise<UserImportResult> {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('envio_users')
      .select('id')
      .eq('gp51_username', gp51Username)
      .single();

    if (existingUser) {
      throw new Error('User already imported');
    }

    // Get vehicles for this user using admin token
    const vehicles = await getMonitorListForUser(gp51Username, adminToken);
    
    // Get positions for vehicles
    const vehiclesWithPositions = await enrichWithPositions(vehicles, adminToken);
    
    // Create Envio user with temporary password
    const tempPassword = generateTempPassword();
    const envioUser = await createEnvioUser(gp51Username, tempPassword, supabase);
    
    // Store vehicles linked to this user
    await storeVehiclesForUser(vehiclesWithPositions, gp51Username, envioUser.id, jobId, supabase);

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
  // Generate a temporary email for the user
  const tempEmail = `${gp51Username}@temp.gp51import.local`;
  
  // Create user in Supabase Auth with temporary password
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: tempEmail,
    password: tempPassword,
    email_confirm: true
  });

  if (authError) {
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }

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
      import_source: 'passwordless_import'
    })
    .select()
    .single();

  if (envioError) {
    // Cleanup auth user if envio user creation fails
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw new Error(`Failed to create envio user: ${envioError.message}`);
  }

  return envioUser;
}

export async function storeVehiclesForUser(
  vehicles: GP51Vehicle[], 
  gp51Username: string, 
  envioUserId: string,
  jobId: string, 
  supabase: any
): Promise<void> {
  console.log(`Storing ${vehicles.length} vehicles for ${gp51Username}...`);

  for (const vehicle of vehicles) {
    try {
      const vehicleData = {
        device_id: vehicle.deviceid,
        device_name: vehicle.devicename,
        envio_user_id: envioUserId,
        gp51_username: gp51Username,
        sim_number: vehicle.simnum || null,
        status: vehicle.status || null,
        last_position: vehicle.lastPosition || null,
        gp51_metadata: {
          simnum: vehicle.simnum,
          lastactivetime: vehicle.lastactivetime,
          original_data: vehicle
        },
        import_job_type: 'passwordless_import',
        is_active: true
      };

      await supabase
        .from('vehicles')
        .upsert(vehicleData, { 
          onConflict: 'device_id',
          ignoreDuplicates: false 
        });

    } catch (error) {
      console.error(`Failed to store vehicle ${vehicle.deviceid}:`, error);
    }
  }
}

export function generateTempPassword(): string {
  return 'temp_' + crypto.randomUUID().replace(/-/g, '');
}
