
import { GP51Vehicle, UserImportResult } from './types.ts';
import { getMonitorListForUser, enrichWithPositions } from './gp51-api.ts';

export async function importUserPasswordless(
  gp51Username: string, 
  adminToken: string, 
  jobId: string, 
  supabase: any
): Promise<UserImportResult> {
  console.log(`Starting atomic import for user: ${gp51Username}`);

  try {
    // Start a transaction-like operation
    const startTime = Date.now();
    
    // Check if user already exists and decide on operation
    const { data: existingUser } = await supabase
      .from('envio_users')
      .select('id, gp51_username')
      .eq('gp51_username', gp51Username)
      .maybeSingle();

    let envioUser;
    let isNewUser = false;

    if (existingUser) {
      console.log(`User ${gp51Username} already exists with ID: ${existingUser.id}, updating...`);
      envioUser = existingUser;
    } else {
      console.log(`Creating new user for ${gp51Username}...`);
      isNewUser = true;
    }

    console.log(`Fetching vehicles for ${gp51Username}...`);
    // Get vehicles for this user using admin token
    const vehicles = await getMonitorListForUser(gp51Username, adminToken);
    
    if (!vehicles || vehicles.length === 0) {
      console.warn(`No vehicles found for user ${gp51Username}`);
    } else {
      console.log(`Found ${vehicles.length} vehicles for ${gp51Username}`);
    }

    console.log(`Enriching ${vehicles.length} vehicles with positions...`);
    // Get positions for vehicles
    const vehiclesWithPositions = await enrichWithPositions(vehicles, adminToken);
    console.log(`Enriched vehicles, got ${vehiclesWithPositions.length} vehicles with position data`);
    
    // Create or update user atomically
    if (isNewUser) {
      console.log(`Creating new Envio user for ${gp51Username}...`);
      const tempPassword = generateTempPassword();
      envioUser = await createEnvioUser(gp51Username, tempPassword, supabase);
    } else {
      console.log(`Updating existing user ${gp51Username}...`);
      const { data: updatedUser, error: updateError } = await supabase
        .from('envio_users')
        .update({
          updated_at: new Date().toISOString(),
          import_source: 'passwordless_import'
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error(`Failed to update existing user ${gp51Username}:`, updateError);
        throw new Error(`Failed to update existing user: ${updateError.message}`);
      }
      envioUser = updatedUser;
    }

    console.log(`Storing ${vehiclesWithPositions.length} vehicles for user ${gp51Username} (ID: ${envioUser.id})...`);
    // Store vehicles atomically with proper error handling
    const vehicleResults = await storeVehiclesForUserAtomic(
      vehiclesWithPositions, 
      gp51Username, 
      envioUser.id,
      jobId, 
      supabase
    );

    const duration = Date.now() - startTime;
    console.log(`Successfully completed atomic import for ${gp51Username} in ${duration}ms: ${vehicleResults.successful} vehicles stored, ${vehicleResults.failed} failed`);
    
    return {
      gp51_username: gp51Username,
      envio_user_id: envioUser.id,
      vehicles_count: vehicleResults.successful,
      success: true,
      operation: isNewUser ? 'created' : 'updated'
    };

  } catch (error) {
    console.error(`Atomic import failed for user ${gp51Username}:`, error);
    
    // Attempt cleanup if user was created but vehicles failed
    // Note: In a real transaction this would be automatic rollback
    
    return {
      gp51_username: gp51Username,
      vehicles_count: 0,
      success: false,
      error: `Atomic import failed: ${error.message}`
    };
  }
}

export async function storeVehiclesForUserAtomic(
  vehicles: GP51Vehicle[], 
  gp51Username: string, 
  envioUserId: string,
  jobId: string, 
  supabase: any
): Promise<{ successful: number; failed: number; errors: any[] }> {
  console.log(`Starting atomic vehicle storage for ${gp51Username}: ${vehicles.length} vehicles`);

  if (!vehicles || vehicles.length === 0) {
    console.log(`No vehicles to store for ${gp51Username}`);
    return { successful: 0, failed: 0, errors: [] };
  }

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as any[]
  };

  // Prepare all vehicle data first
  const vehicleDataArray = vehicles.map(vehicle => {
    return {
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
        import_job_id: jobId,
        import_timestamp: new Date().toISOString()
      },
      import_job_type: 'passwordless_import',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  console.log(`Prepared ${vehicleDataArray.length} vehicle records for batch upsert`);

  try {
    // Attempt batch upsert for better atomicity
    const { data: batchResult, error: batchError } = await supabase
      .from('vehicles')
      .upsert(vehicleDataArray, { 
        onConflict: 'device_id',
        ignoreDuplicates: false 
      })
      .select('device_id');

    if (batchError) {
      console.error(`Batch upsert failed for ${gp51Username}:`, batchError);
      // Fall back to individual inserts with detailed error tracking
      return await storeVehiclesIndividually(vehicleDataArray, gp51Username, supabase);
    }

    results.successful = batchResult?.length || vehicleDataArray.length;
    console.log(`Successfully batch upserted ${results.successful} vehicles for ${gp51Username}`);
    
    return results;

  } catch (error) {
    console.error(`Batch vehicle storage failed for ${gp51Username}:`, error);
    // Fall back to individual processing
    return await storeVehiclesIndividually(vehicleDataArray, gp51Username, supabase);
  }
}

async function storeVehiclesIndividually(
  vehicleDataArray: any[], 
  gp51Username: string, 
  supabase: any
): Promise<{ successful: number; failed: number; errors: any[] }> {
  console.log(`Falling back to individual vehicle storage for ${gp51Username}`);
  
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as any[]
  };

  for (const vehicleData of vehicleDataArray) {
    try {
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .upsert(vehicleData, { 
          onConflict: 'device_id',
          ignoreDuplicates: false 
        });

      if (vehicleError) {
        console.error(`Failed to store vehicle ${vehicleData.device_id}:`, vehicleError);
        results.failed++;
        results.errors.push({
          device_id: vehicleData.device_id,
          error: vehicleError.message,
          timestamp: new Date().toISOString()
        });
      } else {
        results.successful++;
        console.log(`Successfully stored vehicle ${vehicleData.device_id} for ${gp51Username}`);
      }

    } catch (error) {
      console.error(`Exception storing vehicle ${vehicleData.device_id}:`, error);
      results.failed++;
      results.errors.push({
        device_id: vehicleData.device_id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  console.log(`Individual vehicle storage completed for ${gp51Username}: ${results.successful} successful, ${results.failed} failed`);
  return results;
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
        import_source: 'passwordless_import',
        import_timestamp: new Date().toISOString()
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (envioError) {
      console.error(`Envio user creation failed for ${gp51Username}:`, envioError);
      // Cleanup auth user if envio user creation fails
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id);
        console.log(`Cleaned up auth user for failed envio user creation: ${gp51Username}`);
      } catch (cleanupError) {
        console.error(`Failed to cleanup auth user for ${gp51Username}:`, cleanupError);
      }
      throw new Error(`Failed to create envio user: ${envioError.message}`);
    }

    console.log(`Envio user created for ${gp51Username}, ID: ${envioUser.id}`);
    return envioUser;

  } catch (error) {
    console.error(`User creation failed for ${gp51Username}:`, error);
    throw error;
  }
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
