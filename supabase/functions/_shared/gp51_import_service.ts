
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { GP51StandardClient } from './gp51_standard_client.ts';

export interface ImportOptions {
  usernames?: string[];
  importUsers?: boolean;
  importDevices?: boolean;
  conflictResolution?: 'skip' | 'update' | 'replace';
}

export interface ImportStatistics {
  usersProcessed: number;
  usersImported: number;
  devicesProcessed: number;
  devicesImported: number;
  conflicts: number;
}

export interface ImportResult {
  success: boolean;
  message: string;
  statistics: ImportStatistics;
  errors: string[];
}

export class GP51ImportService {
  private supabase: any;
  private gp51Client: GP51StandardClient;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.gp51Client = new GP51StandardClient();
  }

  async authenticate(): Promise<void> {
    const username = Deno.env.get('GP51_ADMIN_USERNAME');
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');

    if (!username || !password) {
      throw new Error('GP51 credentials not configured');
    }

    console.log(`🔐 [GP51ImportService] Authenticating with GP51 as ${username}`);
    
    const authResult = await this.gp51Client.authenticate(username, password);
    if (!authResult.success) {
      throw new Error(`GP51 authentication failed: ${authResult.error}`);
    }

    console.log(`✅ [GP51ImportService] GP51 authentication successful`);
  }

  async performImport(options: ImportOptions): Promise<ImportResult> {
    console.log(`🚀 [GP51ImportService] Starting import with options:`, options);

    const statistics: ImportStatistics = {
      usersProcessed: 0,
      usersImported: 0,
      devicesProcessed: 0,
      devicesImported: 0,
      conflicts: 0
    };

    const errors: string[] = [];

    try {
      // Import users if requested
      if (options.importUsers) {
        const userResult = await this.importUsers(options.usernames);
        statistics.usersProcessed = userResult.processed;
        statistics.usersImported = userResult.imported;
        errors.push(...userResult.errors);
      }

      // Import devices if requested
      if (options.importDevices) {
        const deviceResult = await this.importDevices();
        statistics.devicesProcessed = deviceResult.processed;
        statistics.devicesImported = deviceResult.imported;
        errors.push(...deviceResult.errors);
      }

      const success = errors.length === 0;
      const message = success 
        ? `Import completed successfully: ${statistics.usersImported} users, ${statistics.devicesImported} devices`
        : `Import completed with ${errors.length} errors: ${statistics.usersImported} users, ${statistics.devicesImported} devices`;

      console.log(`📊 [GP51ImportService] Import completed:`, { success, statistics });

      return {
        success,
        message,
        statistics,
        errors: errors.slice(0, 10) // Limit errors in response
      };

    } catch (error) {
      console.error(`❌ [GP51ImportService] Import failed:`, error);
      
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        statistics,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async importUsers(usernames?: string[]): Promise<{ processed: number; imported: number; errors: string[] }> {
    console.log(`👥 [GP51ImportService] Starting user import`);
    
    let processed = 0;
    let imported = 0;
    const errors: string[] = [];

    // If specific usernames provided, import those; otherwise get current user
    const usersToImport = usernames && usernames.length > 0 
      ? usernames 
      : [Deno.env.get('GP51_ADMIN_USERNAME')!];

    for (const username of usersToImport) {
      try {
        processed++;
        console.log(`👤 [GP51ImportService] Importing user: ${username}`);
        
        const userDetailResult = await this.gp51Client.queryUserDetail(username);
        if (!userDetailResult.success) {
          errors.push(`Failed to get user details for ${username}: ${userDetailResult.error}`);
          continue;
        }

        const success = await this.importUserToSupabase(userDetailResult.data, username);
        if (success) {
          imported++;
        } else {
          errors.push(`Failed to import user ${username} to database`);
        }

      } catch (error) {
        console.error(`❌ [GP51ImportService] Failed to import user ${username}:`, error);
        errors.push(`User ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ [GP51ImportService] User import completed: ${imported}/${processed} users imported`);
    return { processed, imported, errors };
  }

  private async importDevices(): Promise<{ processed: number; imported: number; errors: string[] }> {
    console.log(`🚗 [GP51ImportService] Starting device import`);
    
    let processed = 0;
    let imported = 0;
    const errors: string[] = [];

    try {
      const monitorResult = await this.gp51Client.queryMonitorList();
      if (!monitorResult.success) {
        errors.push(`Failed to get monitor list: ${monitorResult.error}`);
        return { processed, imported, errors };
      }

      const devices = Array.isArray(monitorResult.data) ? monitorResult.data : 
                     Array.isArray(monitorResult.data?.data) ? monitorResult.data.data : [];

      if (!Array.isArray(devices) || devices.length === 0) {
        console.log(`⚠️ [GP51ImportService] No devices found in monitor list`);
        return { processed, imported, errors };
      }

      console.log(`📦 [GP51ImportService] Found ${devices.length} devices to import`);

      // Process devices in batches
      const batchSize = 50;
      for (let i = 0; i < devices.length; i += batchSize) {
        const batch = devices.slice(i, i + batchSize);
        console.log(`📦 [GP51ImportService] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(devices.length/batchSize)} (${batch.length} devices)`);
        
        for (const device of batch) {
          try {
            processed++;
            const deviceId = device.deviceid || device.imei || device.deviceId;
            console.log(`📝 [GP51ImportService] Importing device: ${deviceId}`);
            
            const success = await this.importDeviceToSupabase(device);
            if (success) {
              imported++;
            } else {
              errors.push(`Failed to import device ${deviceId} to database`);
            }

          } catch (error) {
            const deviceId = device.deviceid || device.imei || device.deviceId || 'unknown';
            console.error(`❌ [GP51ImportService] Failed to import device ${deviceId}:`, error);
            errors.push(`Device ${deviceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

    } catch (error) {
      console.error(`❌ [GP51ImportService] Device import failed:`, error);
      errors.push(`Device import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log(`✅ [GP51ImportService] Device import completed: ${imported}/${processed} devices imported`);
    return { processed, imported, errors };
  }

  private async importUserToSupabase(userData: any, username: string): Promise<boolean> {
    try {
      // Get the current authenticated user (admin) who will own these imported users
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        console.error(`❌ [GP51ImportService] No authenticated user found for user import`);
        return false;
      }

      const userRecord = {
        username: username,
        email: userData.email || `${username}@imported.local`,
        phone_number: userData.phone || null,
        user_id: user.id, // Link to current admin user
        gp51_metadata: {
          original_data: userData,
          imported_at: new Date().toISOString(),
          source: 'gp51_bulk_import'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('envio_users')
        .upsert(userRecord, { 
          onConflict: 'username',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`❌ [GP51ImportService] Failed to import user ${username}:`, error);
        return false;
      }

      console.log(`✅ [GP51ImportService] Successfully imported user: ${username}`);
      return true;

    } catch (error) {
      console.error(`❌ [GP51ImportService] Error importing user ${username}:`, error);
      return false;
    }
  }

  private async importDeviceToSupabase(deviceData: any): Promise<boolean> {
    try {
      // Get the current authenticated user (admin) who will own these imported devices
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        console.error(`❌ [GP51ImportService] No authenticated user found for device import`);
        return false;
      }

      const deviceId = deviceData.deviceid || deviceData.imei || deviceData.deviceId;
      if (!deviceId) {
        console.error(`❌ [GP51ImportService] Device missing required ID field`);
        return false;
      }

      const deviceRecord = {
        name: deviceData.devicename || deviceData.alias || `Device ${deviceId}`,
        gp51_device_id: String(deviceId),
        user_id: user.id, // Link to current admin user
        device_type: deviceData.devicetype || null,
        sim_number: deviceData.simcard || deviceData.sim || null,
        status: deviceData.status || 'active',
        gp51_metadata: {
          original_data: deviceData,
          imported_at: new Date().toISOString(),
          source: 'gp51_bulk_import'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('vehicles')
        .upsert(deviceRecord, { 
          onConflict: 'gp51_device_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`❌ [GP51ImportService] Failed to import device ${deviceId}:`, error);
        return false;
      }

      console.log(`✅ [GP51ImportService] Successfully imported device: ${deviceId}`);
      return true;

    } catch (error) {
      console.error(`❌ [GP51ImportService] Error importing device:`, error);
      return false;
    }
  }
}
