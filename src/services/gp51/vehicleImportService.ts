
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

interface GP51Device {
  deviceid: string;
  devicename: string;
  creater: string; // Changed from 'username' to 'creater'
  usertype: number;
  isfree: boolean;
  devicetype: string; // Changed from number to string to match actual API
  simnum?: string;
  activated?: boolean;
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
        console.error('❌ GP51 fetch error:', fetchError);
        throw new Error(`Failed to fetch GP51 data: ${fetchError.message}`);
      }

      if (!gp51Data.success) {
        console.error('❌ GP51 API error:', gp51Data);
        throw new Error(`GP51 API error: ${gp51Data.details || gp51Data.error}`);
      }

      console.log('📊 GP51 response structure:', {
        hasData: !!gp51Data.data,
        hasGroups: !!gp51Data.data?.groups,
        groupCount: gp51Data.data?.groups?.length || 0
      });

      const groups = gp51Data.data?.groups || [];
      const devices = groups.flatMap((group: GP51Group) => group.devices || []);
      
      console.log(`📡 Found ${devices.length} devices from GP51`);
      console.log('🔍 Sample device structure:', devices.length > 0 ? devices[0] : 'No devices');

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
      console.log(`🔄 Transformed ${vehicleRecords.length} device records`);
      
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
    const errors = [];
    
    for (const device of devices) {
      try {
        console.log(`🔄 Processing device:`, {
          deviceid: device.deviceid,
          devicename: device.devicename,
          creater: device.creater,
          usertype: device.usertype,
          devicetype: device.devicetype
        });

        // Validate required fields
        if (!device.deviceid) {
          errors.push(`Device missing deviceid: ${JSON.stringify(device)}`);
          continue;
        }

        if (!device.creater) {
          console.warn(`⚠️ Device ${device.deviceid} has no creater, skipping user assignment`);
        }

        // Find or create user for this device (only if creater exists)
        let userId = null;
        if (device.creater) {
          userId = await this.findOrCreateUser(device.creater, device.usertype || 1);
          if (!userId) {
            errors.push(`Failed to create/find user for creater: ${device.creater}`);
          }
        }
        
        const vehicleRecord = {
          gp51_device_id: device.deviceid,
          name: device.devicename || device.deviceid,
          user_id: userId,
          sim_number: device.simnum || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log(`✅ Created vehicle record:`, vehicleRecord);
        vehicleRecords.push(vehicleRecord);
      } catch (error) {
        const errorMsg = `Failed to transform device ${device.deviceid}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    if (errors.length > 0) {
      console.warn(`⚠️ Transformation errors:`, errors);
    }
    
    return vehicleRecords;
  }

  private static async findOrCreateUser(gp51CreaterName: string, userType: number): Promise<string | null> {
    try {
      console.log(`👤 Finding/creating user for creater: ${gp51CreaterName}, type: ${userType}`);

      // First, try to find existing user by GP51 username
      const { data: existingUser, error: findError } = await supabase
        .from('envio_users')
        .select('id')
        .eq('gp51_username', gp51CreaterName)
        .single();

      if (existingUser && !findError) {
        console.log(`✅ Found existing user: ${existingUser.id} for ${gp51CreaterName}`);
        return existingUser.id;
      }

      console.log(`🆕 Creating new user for ${gp51CreaterName}`);

      // If no existing user found, create a new one
      const { data: newUser, error: createError } = await supabase
        .from('envio_users')
        .insert({
          name: gp51CreaterName,
          email: `${gp51CreaterName}@gp51.import`,
          gp51_username: gp51CreaterName,
          gp51_user_type: userType,
          is_gp51_imported: true,
          import_source: 'gp51_vehicle_import',
          registration_status: 'imported',
          needs_password_set: true
        })
        .select('id')
        .single();

      if (createError) {
        console.error(`❌ Failed to create user for ${gp51CreaterName}:`, createError);
        return null;
      }

      console.log(`✅ Created new user: ${newUser?.id} for ${gp51CreaterName}`);
      return newUser?.id || null;
    } catch (error) {
      console.error(`❌ Error handling user ${gp51CreaterName}:`, error);
      return null;
    }
  }

  private static async insertVehicles(vehicleRecords: any[]): Promise<GP51ImportResult> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const vehicles: VehicleData[] = [];

    console.log(`📦 Inserting ${vehicleRecords.length} vehicle records`);

    for (const record of vehicleRecords) {
      try {
        console.log(`🚗 Processing vehicle record:`, record);

        // Check if vehicle already exists
        const { data: existing, error: checkError } = await supabase
          .from('vehicles')
          .select('id')
          .eq('gp51_device_id', record.gp51_device_id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`❌ Error checking existing vehicle:`, checkError);
          errors.push(`Error checking vehicle ${record.gp51_device_id}: ${checkError.message}`);
          continue;
        }

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
          console.error(`❌ Insert error for ${record.gp51_device_id}:`, insertError);
          errors.push(`Failed to insert ${record.gp51_device_id}: ${insertError.message}`);
          continue;
        }

        if (insertedVehicle) {
          imported++;
          console.log(`✅ Successfully inserted vehicle: ${insertedVehicle.id}`);
          
          // Transform to VehicleData format
          const vehicleData: VehicleData = {
            id: insertedVehicle.id,
            device_id: insertedVehicle.gp51_device_id,
            device_name: insertedVehicle.name,
            user_id: insertedVehicle.user_id,
            sim_number: insertedVehicle.sim_number,
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
        const errorMsg = `Error processing ${record.gp51_device_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`📊 Import summary: ${imported} imported, ${skipped} skipped, ${errors.length} errors`);

    return {
      success: errors.length === 0 || imported > 0,
      imported,
      skipped,
      errors,
      vehicles
    };
  }
}
