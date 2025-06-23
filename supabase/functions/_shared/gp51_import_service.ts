
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface ImportOptions {
  usernames?: string[];
  importUsers?: boolean;
  importDevices?: boolean;
  conflictResolution?: 'skip' | 'update' | 'create_new';
}

export interface ImportResult {
  success: boolean;
  message: string;
  statistics: {
    usersProcessed: number;
    usersImported: number;
    devicesProcessed: number;
    devicesImported: number;
    conflicts: number;
  };
  errors: string[];
}

export class GP51ImportService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private supabase: any;
  private gp51Client: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Import GP51 client
    import('./gp51_standard_client.ts').then(module => {
      this.gp51Client = new module.GP51StandardClient();
    }).catch(error => {
      console.error('❌ [GP51ImportService] Failed to import GP51 client:', error);
    });
  }

  async authenticate(): Promise<void> {
    const username = Deno.env.get('GP51_ADMIN_USERNAME');
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!username || !password) {
      throw new Error('GP51 credentials not configured');
    }

    console.log(`🔐 [GP51ImportService] Authenticating with GP51 as ${username}`);
    
    if (!this.gp51Client) {
      const module = await import('./gp51_standard_client.ts');
      this.gp51Client = new module.GP51StandardClient();
    }
    
    await this.gp51Client.authenticate(username, password);
    console.log('✅ [GP51ImportService] GP51 authentication successful');
  }

  async performImport(options: ImportOptions): Promise<ImportResult> {
    console.log(`🚀 [GP51ImportService] Starting import with options:`, options);

    const result: ImportResult = {
      success: false,
      message: '',
      statistics: {
        usersProcessed: 0,
        usersImported: 0,
        devicesProcessed: 0,
        devicesImported: 0,
        conflicts: 0
      },
      errors: []
    };

    try {
      // Import users first
      if (options.importUsers) {
        console.log('👥 [GP51ImportService] Starting user import');
        await this.importUsers(options, result);
        console.log(`✅ [GP51ImportService] User import completed: ${result.statistics.usersImported}/${result.statistics.usersProcessed} users imported`);
      }

      // Then import devices
      if (options.importDevices) {
        console.log('🚗 [GP51ImportService] Starting device import');
        await this.importDevices(options, result);
        console.log(`✅ [GP51ImportService] Device import completed: ${result.statistics.devicesImported}/${result.statistics.devicesProcessed} devices imported`);
      }

      result.success = result.statistics.usersImported > 0 || result.statistics.devicesImported > 0;
      result.message = result.success 
        ? `Import completed: ${result.statistics.usersImported} users, ${result.statistics.devicesImported} devices`
        : 'Import completed but no items were imported';

    } catch (error) {
      console.error('❌ [GP51ImportService] Import failed:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      result.message = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    console.log(`📊 [GP51ImportService] Import completed:`, {
      success: result.success,
      statistics: result.statistics
    });

    return result;
  }

  private async importUsers(options: ImportOptions, result: ImportResult): Promise<void> {
    try {
      const authenticatedUser = await this.gp51Client.getCurrentUser();
      if (!authenticatedUser) {
        console.error('❌ [GP51ImportService] No authenticated user found for user import');
        result.errors.push('No authenticated user found for user import');
        return;
      }

      console.log(`👤 [GP51ImportService] Importing user: ${authenticatedUser.username}`);
      result.statistics.usersProcessed++;

      // Get detailed user information
      const userDetails = await this.gp51Client.queryUserDetail(authenticatedUser.username);
      
      if (userDetails) {
        await this.importUserToSupabase(userDetails, options, result);
      } else {
        result.errors.push(`Failed to get details for user: ${authenticatedUser.username}`);
      }

    } catch (error) {
      console.error('❌ [GP51ImportService] User import error:', error);
      result.errors.push(`User import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async importDevices(options: ImportOptions, result: ImportResult): Promise<void> {
    try {
      const monitorResponse = await this.gp51Client.queryMonitorList();
      
      if (!monitorResponse?.groups || monitorResponse.groups.length === 0) {
        console.warn('⚠️ [GP51ImportService] No devices found in monitor list');
        return;
      }

      // Process all devices from all groups
      for (const group of monitorResponse.groups) {
        if (group.devices && group.devices.length > 0) {
          for (const device of group.devices) {
            result.statistics.devicesProcessed++;
            
            try {
              await this.importDeviceToSupabase(device, options, result);
              result.statistics.devicesImported++;
            } catch (error) {
              console.error(`❌ [GP51ImportService] Failed to import device ${device.deviceid}:`, error);
              result.errors.push(`Device ${device.deviceid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ [GP51ImportService] Device import error:', error);
      result.errors.push(`Device import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async importUserToSupabase(userDetails: any, options: ImportOptions, result: ImportResult): Promise<void> {
    // For now, we're not creating new users in Supabase
    // This would require proper user management integration
    console.log(`👤 [GP51ImportService] User details retrieved for: ${userDetails.username}`);
    // result.statistics.usersImported++; // Only increment when actually imported
  }

  private async importDeviceToSupabase(deviceData: any, options: ImportOptions, result: ImportResult): Promise<void> {
    try {
      // Get the current authenticated user from Supabase
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('No authenticated user found');
      }

      const deviceId = deviceData.deviceid || deviceData.id;
      
      if (!deviceId) {
        throw new Error('Device ID is missing');
      }

      // Create device record with proper field mapping
      const deviceRecord = {
        name: deviceData.devicename || deviceData.alias || `Device ${deviceId}`,
        gp51_device_id: String(deviceId),
        user_id: user.id,
        device_type: deviceData.devicetype || null,
        sim_number: deviceData.simcard || deviceData.sim || null,
        status: deviceData.status || 'active',
        creator: deviceData.creater || deviceData.creator || null, // Map GP51's 'creater' field to our 'creator' column
        gp51_metadata: {
          original_data: deviceData,
          imported_at: new Date().toISOString(),
          source: 'gp51_bulk_import'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log(`🚗 [GP51ImportService] Importing device: ${deviceId} with creator: ${deviceRecord.creator}`);

      // Handle conflict resolution
      if (options.conflictResolution === 'skip') {
        // Check if device already exists
        const { data: existingDevice } = await this.supabase
          .from('vehicles')
          .select('id')
          .eq('gp51_device_id', String(deviceId))
          .single();

        if (existingDevice) {
          console.log(`⏭️ [GP51ImportService] Skipping existing device: ${deviceId}`);
          return;
        }
      }

      // Upsert the device
      const { data, error } = await this.supabase
        .from('vehicles')
        .upsert(deviceRecord, {
          onConflict: 'gp51_device_id',
          ignoreDuplicates: options.conflictResolution === 'skip'
        })
        .select('id');

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      console.log(`✅ [GP51ImportService] Successfully imported device: ${deviceId}`);

    } catch (error) {
      console.error(`❌ [GP51ImportService] Failed to import device ${deviceData.deviceid}:`, error);
      throw error;
    }
  }
}
