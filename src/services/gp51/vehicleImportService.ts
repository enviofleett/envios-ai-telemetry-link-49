
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

interface GP51Device {
  deviceid: string;
  devicename: string;
  username: string;
  usertype: number;
  isfree: boolean;
  devicetype: number;
  // Add other properties as needed
}

interface GP51Group {
  groupname: string;
  devices: GP51Device[];
}

interface GP51ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  vehicles: VehicleData[];
}

export class GP51VehicleImportService {
  static async importVehiclesFromGP51(): Promise<GP51ImportResult> {
    try {
      console.log('🚀 Starting GP51 vehicle import...');
      
      // Fetch live data from GP51
      const { data: gp51Data, error: fetchError } = await supabase.functions.invoke('fetchLiveGp51Data');
      
      if (fetchError) {
        throw new Error(`Failed to fetch GP51 data: ${fetchError.message}`);
      }

      if (!gp51Data.success) {
        throw new Error(`GP51 API error: ${gp51Data.details || gp51Data.error}`);
      }

      const groups = gp51Data.data?.groups || [];
      const devices = groups.flatMap((group: GP51Group) => group.devices || []);
      
      console.log(`📡 Found ${devices.length} devices from GP51`);

      if (devices.length === 0) {
        return {
          success: true,
          imported: 0,
          skipped: 0,
          errors: [],
          vehicles: []
        };
      }

      // Transform GP51 devices to vehicle records
      const vehicleRecords = await this.transformDevicesToVehicles(devices);
      
      // Import vehicles to database
      const importResult = await this.insertVehicles(vehicleRecords);
      
      return importResult;
    } catch (error) {
      console.error('❌ GP51 vehicle import failed:', error);
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        vehicles: []
      };
    }
  }

  private static async transformDevicesToVehicles(devices: GP51Device[]): Promise<any[]> {
    const vehicleRecords = [];
    
    for (const device of devices) {
      try {
        // Find or create user for this device
        const userId = await this.findOrCreateUser(device.username, device.usertype);
        
        const vehicleRecord = {
          gp51_device_id: device.deviceid,
          name: device.devicename || device.deviceid,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        vehicleRecords.push(vehicleRecord);
      } catch (error) {
        console.error(`❌ Failed to transform device ${device.deviceid}:`, error);
      }
    }
    
    return vehicleRecords;
  }

  private static async findOrCreateUser(gp51Username: string, userType: number): Promise<string | null> {
    try {
      // First, try to find existing user by GP51 username
      const { data: existingUser, error: findError } = await supabase
        .from('envio_users')
        .select('id')
        .eq('gp51_username', gp51Username)
        .single();

      if (existingUser && !findError) {
        return existingUser.id;
      }

      // If no existing user found, create a new one
      const { data: newUser, error: createError } = await supabase
        .from('envio_users')
        .insert({
          name: gp51Username,
          email: `${gp51Username}@gp51.import`,
          gp51_username: gp51Username,
          gp51_user_type: userType,
          is_gp51_imported: true,
          import_source: 'gp51_vehicle_import',
          registration_status: 'imported',
          needs_password_set: true
        })
        .select('id')
        .single();

      if (createError) {
        console.error(`❌ Failed to create user for ${gp51Username}:`, createError);
        return null;
      }

      return newUser?.id || null;
    } catch (error) {
      console.error(`❌ Error handling user ${gp51Username}:`, error);
      return null;
    }
  }

  private static async insertVehicles(vehicleRecords: any[]): Promise<GP51ImportResult> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const vehicles: VehicleData[] = [];

    for (const record of vehicleRecords) {
      try {
        // Check if vehicle already exists
        const { data: existing } = await supabase
          .from('vehicles')
          .select('id')
          .eq('gp51_device_id', record.gp51_device_id)
          .single();

        if (existing) {
          skipped++;
          console.log(`⏭️ Skipping existing vehicle: ${record.gp51_device_id}`);
          continue;
        }

        // Insert new vehicle
        const { data: insertedVehicle, error: insertError } = await supabase
          .from('vehicles')
          .insert(record)
          .select('*')
          .single();

        if (insertError) {
          errors.push(`Failed to insert ${record.gp51_device_id}: ${insertError.message}`);
          continue;
        }

        if (insertedVehicle) {
          imported++;
          // Transform to VehicleData format
          const vehicleData: VehicleData = {
            id: insertedVehicle.id,
            device_id: insertedVehicle.gp51_device_id,
            device_name: insertedVehicle.name,
            user_id: insertedVehicle.user_id,
            created_at: insertedVehicle.created_at,
            updated_at: insertedVehicle.updated_at,
            status: 'offline',
            is_active: true,
            isOnline: false,
            isMoving: false,
            alerts: [],
            lastUpdate: new Date(insertedVehicle.updated_at),
            gp51_metadata: {}
          };
          vehicles.push(vehicleData);
        }
      } catch (error) {
        errors.push(`Error processing ${record.gp51_device_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0 || imported > 0,
      imported,
      skipped,
      errors,
      vehicles
    };
  }
}
