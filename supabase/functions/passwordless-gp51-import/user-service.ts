
import { GP51Vehicle, UserImportResult } from './types.ts';
import { getMonitorListForUser, enrichWithPositions } from './gp51-api.ts';
import { createEnvioUser } from './user-creator.ts';
import { storeVehiclesForUserAtomic } from './vehicle-storage.ts';
import { generateTempPassword } from './password-generator.ts';

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

// Re-export functions for backward compatibility
export { createEnvioUser } from './user-creator.ts';
export { storeVehiclesForUserAtomic } from './vehicle-storage.ts';
export { generateTempPassword } from './password-generator.ts';
