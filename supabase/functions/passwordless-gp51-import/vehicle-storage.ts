
import { GP51Vehicle } from './types.ts';

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
