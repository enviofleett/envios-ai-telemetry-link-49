
import { supabase } from '@/integrations/supabase/client';
import { healthMonitoringService } from './healthMonitoringService';

export interface GP51ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  vehicles: any[];
}

export class GP51VehicleImportService {
  static async importVehiclesFromGP51(): Promise<GP51ImportResult> {
    const startTime = Date.now();
    
    try {
      console.log('🚗 Starting GP51 vehicle import from records...');
      
      // Fetch GP51 data using the live data endpoint
      const { data: gp51Data, error } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: {}
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        console.error('❌ GP51 data fetch failed:', error);
        healthMonitoringService.recordHealthCheck(false, responseTime, error.message);
        return {
          success: false,
          imported: 0,
          skipped: 0,
          errors: [error.message],
          vehicles: []
        };
      }

      if (!gp51Data.success) {
        console.error('❌ GP51 API returned error:', gp51Data.error);
        healthMonitoringService.recordHealthCheck(false, responseTime, gp51Data.error);
        return {
          success: false,
          imported: 0,
          skipped: 0,
          errors: [gp51Data.error || 'GP51 API error'],
          vehicles: []
        };
      }

      console.log('✅ GP51 data fetched successfully');
      healthMonitoringService.recordHealthCheck(true, responseTime);

      // Get the admin user ID to associate vehicles with
      const adminUserId = await this.getAdminUserId();
      if (!adminUserId) {
        return {
          success: false,
          imported: 0,
          skipped: 0,
          errors: ['Could not find admin user to associate vehicles with'],
          vehicles: []
        };
      }

      // Extract vehicles from the records array
      const extractionResult = this.extractVehiclesFromRecords(gp51Data.data, adminUserId);
      
      if (extractionResult.vehicles.length === 0) {
        console.log('⚠️ No vehicles found in GP51 records');
        return {
          success: true,
          imported: 0,
          skipped: 0,
          errors: extractionResult.errors,
          vehicles: []
        };
      }

      console.log(`📋 Found ${extractionResult.vehicles.length} unique devices from ${extractionResult.totalRecords} position records`);

      // Import vehicles to database
      const importResult = await this.importVehiclesToDatabase(extractionResult.vehicles);
      
      return {
        success: true,
        imported: importResult.imported,
        skipped: importResult.skipped,
        errors: [...extractionResult.errors, ...importResult.errors],
        vehicles: extractionResult.vehicles
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('❌ GP51 vehicle import exception:', error);
      healthMonitoringService.recordHealthCheck(false, responseTime, error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown import error'],
        vehicles: []
      };
    }
  }

  private static async getAdminUserId(): Promise<string | null> {
    try {
      console.log('🔍 Looking up admin user for vehicle association...');
      
      // Look for admin user by email
      const { data: adminUser, error } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', 'chudesyl@gmail.com')
        .single();

      if (error) {
        console.error('❌ Error finding admin user:', error);
        return null;
      }

      if (adminUser) {
        console.log('✅ Found admin user for vehicle association');
        return adminUser.id;
      }

      // Fallback: get the first user if admin not found
      const { data: firstUser, error: firstUserError } = await supabase
        .from('envio_users')
        .select('id')
        .limit(1)
        .single();

      if (firstUserError) {
        console.error('❌ Error finding any user:', firstUserError);
        return null;
      }

      console.log('⚠️ Admin user not found, using first available user for vehicle association');
      return firstUser?.id || null;

    } catch (error) {
      console.error('❌ Exception in getAdminUserId:', error);
      return null;
    }
  }

  private static extractVehiclesFromRecords(gp51ResponseData: any, userId: string): {
    vehicles: any[];
    totalRecords: number;
    errors: string[];
  } {
    const uniqueDeviceIds = new Set<string>();
    const vehiclesToImport: any[] = [];
    const errors: string[] = [];
    let totalRecords = 0;

    console.log('🔍 Analyzing GP51 response structure for vehicle extraction...');
    
    // Enhanced logging of the response structure
    const hasRecords = gp51ResponseData && Array.isArray(gp51ResponseData.records);
    const recordsLength = hasRecords ? gp51ResponseData.records.length : 0;
    
    console.log('📊 GP51 Records Analysis:', {
      hasResponseData: !!gp51ResponseData,
      hasRecords,
      recordsLength,
      recordsType: typeof gp51ResponseData?.records,
      topLevelKeys: gp51ResponseData ? Object.keys(gp51ResponseData) : []
    });

    if (!hasRecords) {
      const error = 'No records array found in GP51 response';
      console.error('❌', error);
      errors.push(error);
      return { vehicles: [], totalRecords: 0, errors };
    }

    if (recordsLength === 0) {
      const error = 'Records array is empty';
      console.log('⚠️', error);
      errors.push(error);
      return { vehicles: [], totalRecords: 0, errors };
    }

    totalRecords = recordsLength;
    console.log(`📍 Processing ${totalRecords} position records to extract unique devices...`);

    // Sample the first record to understand structure
    const firstRecord = gp51ResponseData.records[0];
    console.log('🔬 Sample record structure:', {
      recordKeys: Object.keys(firstRecord),
      hasDeviceId: 'deviceid' in firstRecord,
      hasDeviceName: 'devicename' in firstRecord,
      hasImei: 'imei' in firstRecord,
      deviceIdValue: firstRecord.deviceid,
      deviceNameValue: firstRecord.devicename
    });

    // Extract unique devices from position records
    gp51ResponseData.records.forEach((record: any, index: number) => {
      try {
        // Try different possible device identifier fields
        const deviceId = record.deviceid || record.imei || record.device_id || record.unitId;
        
        if (!deviceId) {
          if (index < 5) { // Only log first few errors to avoid spam
            console.warn(`⚠️ No device identifier found in record ${index}:`, Object.keys(record));
          }
          return;
        }

        // Convert to string to ensure consistency
        const deviceIdStr = String(deviceId);

        if (!uniqueDeviceIds.has(deviceIdStr)) {
          uniqueDeviceIds.add(deviceIdStr);

          // Extract available device information from the record
          const vehicle = {
            gp51_device_id: deviceIdStr,
            name: record.devicename || record.device_name || deviceIdStr,
            sim_number: record.simnum || record.sim_number || null,
            status: this.determineDeviceStatus(record),
            is_active: true, // Device has recent position data, so it's active
            user_id: userId, // Associate with the admin user
            gp51_metadata: {
              last_position_time: record.loctime || record.timestamp || null,
              latitude: record.lat || record.latitude || null,
              longitude: record.lng || record.longitude || null,
              original_record: record // Store original for debugging
            }
          };

          vehiclesToImport.push(vehicle);
        }
      } catch (recordError) {
        const error = `Error processing record ${index}: ${recordError}`;
        console.error('❌', error);
        if (errors.length < 10) { // Limit error collection
          errors.push(error);
        }
      }
    });

    console.log(`✅ Extracted ${uniqueDeviceIds.size} unique devices from ${totalRecords} records`);
    
    return {
      vehicles: vehiclesToImport,
      totalRecords,
      errors
    };
  }

  private static determineDeviceStatus(record: any): string {
    // Determine device status based on available data in the record
    if (record.loctime || record.timestamp) {
      const lastPositionTime = record.loctime || record.timestamp;
      const now = Date.now();
      const timeDiff = now - lastPositionTime;
      
      // If last position is within 1 hour, consider online
      if (timeDiff < 3600000) { // 1 hour in milliseconds
        return 'online';
      }
      // If last position is within 24 hours, consider offline
      else if (timeDiff < 86400000) { // 24 hours in milliseconds
        return 'offline';
      }
    }
    
    // Default to inactive if we can't determine status
    return 'inactive';
  }

  private static async importVehiclesToDatabase(vehicles: any[]): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    console.log(`💾 Starting database import for ${vehicles.length} vehicles...`);

    for (const vehicle of vehicles) {
      try {
        // Check if vehicle already exists using gp51_device_id
        const { data: existingVehicle, error: checkError } = await supabase
          .from('vehicles')
          .select('id, gp51_device_id')
          .eq('gp51_device_id', vehicle.gp51_device_id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('❌ Error checking existing vehicle:', checkError);
          errors.push(`Error checking vehicle ${vehicle.gp51_device_id}: ${checkError.message}`);
          continue;
        }

        if (existingVehicle) {
          console.log(`⏭️ Vehicle ${vehicle.gp51_device_id} already exists, skipping`);
          skipped++;
          continue;
        }

        // Insert new vehicle with all required fields
        const { error: insertError } = await supabase
          .from('vehicles')
          .insert({
            gp51_device_id: vehicle.gp51_device_id,
            name: vehicle.name,
            sim_number: vehicle.sim_number,
            status: vehicle.status,
            is_active: vehicle.is_active,
            user_id: vehicle.user_id, // Now included as required
            gp51_metadata: vehicle.gp51_metadata,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Error inserting vehicle:', insertError);
          errors.push(`Error inserting vehicle ${vehicle.gp51_device_id}: ${insertError.message}`);
        } else {
          console.log(`✅ Imported vehicle: ${vehicle.name} (${vehicle.gp51_device_id})`);
          imported++;
        }

      } catch (error) {
        const errorMessage = `Exception importing vehicle ${vehicle.gp51_device_id}: ${error}`;
        console.error('❌', errorMessage);
        errors.push(errorMessage);
      }
    }

    console.log(`📊 Import complete: ${imported} imported, ${skipped} skipped, ${errors.length} errors`);
    
    return { imported, skipped, errors };
  }
}
