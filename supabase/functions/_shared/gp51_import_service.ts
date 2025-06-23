
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
  private supabaseUrl: string;
  private supabaseServiceKey: string;
  private gp51Client: any;
  private adminUserId: string;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseServiceKey = supabaseServiceKey;
    this.adminUserId = Deno.env.get('GP51_ADMIN_USER_ID') || '';
    
    if (!this.adminUserId) {
      throw new Error('GP51_ADMIN_USER_ID environment variable is required');
    }
    
    console.log(`🔧 [GP51ImportService] Initialized with admin user ID: ${this.adminUserId}`);
  }

  async authenticate(): Promise<void> {
    const gp51Username = Deno.env.get('GP51_ADMIN_USERNAME');
    const gp51Password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!gp51Username || !gp51Password) {
      throw new Error('GP51 credentials not configured');
    }

    // Import the GP51Standard client
    const { GP51Standard } = await import('./gp51_standard_client.ts');
    this.gp51Client = new GP51Standard();
    
    console.log('🔑 [GP51ImportService] Authenticating with GP51...');
    await this.gp51Client.authenticate(gp51Username, gp51Password);
    console.log('✅ [GP51ImportService] GP51 authentication successful');
  }

  async performImport(options: ImportOptions): Promise<ImportResult> {
    console.log('🚀 [GP51ImportService] Starting import process...');
    console.log('📋 [GP51ImportService] Import options:', options);

    const statistics: ImportStatistics = {
      usersProcessed: 0,
      usersImported: 0,
      devicesProcessed: 0,
      devicesImported: 0,
      conflicts: 0
    };

    const errors: string[] = [];

    try {
      // Import users first if enabled
      if (options.importUsers) {
        console.log('👥 [GP51ImportService] Starting user import');
        try {
          const userResult = await this.importUsers(options.usernames);
          statistics.usersProcessed = userResult.processed;
          statistics.usersImported = userResult.imported;
          console.log(`✅ [GP51ImportService] User import completed: ${userResult.imported}/${userResult.processed} users imported`);
        } catch (error) {
          const errorMsg = `User import error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ [GP51ImportService] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      // Import devices if enabled
      if (options.importDevices) {
        console.log('🚗 [GP51ImportService] Starting device import');
        try {
          const deviceResult = await this.importDevices(options.conflictResolution || 'update');
          statistics.devicesProcessed = deviceResult.processed;
          statistics.devicesImported = deviceResult.imported;
          statistics.conflicts = deviceResult.conflicts;
          console.log(`✅ [GP51ImportService] Device import completed: ${deviceResult.imported}/${deviceResult.processed} devices imported`);
        } catch (error) {
          const errorMsg = `Device import error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ [GP51ImportService] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      const success = errors.length === 0 && (statistics.usersImported > 0 || statistics.devicesImported > 0);
      const message = success 
        ? `Import successful: ${statistics.usersImported} users and ${statistics.devicesImported} devices imported`
        : statistics.usersImported === 0 && statistics.devicesImported === 0 
          ? 'Import completed but no items were imported'
          : `Import completed with ${errors.length} errors`;

      const result: ImportResult = {
        success,
        message,
        statistics,
        errors
      };

      console.log('📊 [GP51ImportService] Import completed:', {
        success: result.success,
        statistics: result.statistics
      });

      return result;

    } catch (error) {
      const errorMsg = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51ImportService] ${errorMsg}`);
      
      return {
        success: false,
        message: errorMsg,
        statistics,
        errors: [errorMsg]
      };
    }
  }

  private async importUsers(usernames?: string[]): Promise<{ processed: number; imported: number }> {
    // For now, user import is not implemented in the GP51 client
    // This would require additional GP51 API endpoints for user management
    console.log('⚠️ [GP51ImportService] User import not yet implemented - GP51 API limitation');
    return { processed: 0, imported: 0 };
  }

  private async importDevices(conflictResolution: string): Promise<{ processed: number; imported: number; conflicts: number }> {
    console.log('🚗 [GP51ImportService] Fetching devices from GP51...');
    
    // Get monitor list (devices) from GP51
    const monitorList = await this.gp51Client.getMonitorList();
    
    if (!monitorList || !monitorList.groups || monitorList.groups.length === 0) {
      console.error('⚠️ [GP51ImportService] No devices found in monitor list');
      return { processed: 0, imported: 0, conflicts: 0 };
    }

    let processed = 0;
    let imported = 0;
    let conflicts = 0;

    // Process each group and its devices
    for (const group of monitorList.groups) {
      if (!group.devices || group.devices.length === 0) {
        continue;
      }

      console.log(`📦 [GP51ImportService] Processing group: ${group.groupname} (${group.devices.length} devices)`);

      for (const device of group.devices) {
        processed++;
        
        try {
          const result = await this.importDeviceToSupabase(device, group, conflictResolution);
          if (result.imported) {
            imported++;
          }
          if (result.conflict) {
            conflicts++;
          }
        } catch (error) {
          console.error(`❌ [GP51ImportService] Failed to import device ${device.deviceid}:`, error);
        }
      }
    }

    return { processed, imported, conflicts };
  }

  private async importDeviceToSupabase(device: any, group: any, conflictResolution: string): Promise<{ imported: boolean; conflict: boolean }> {
    try {
      // Create Supabase client
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabase = createClient(this.supabaseUrl, this.supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Use the configured admin user ID instead of trying to get authenticated user
      const userId = this.adminUserId;
      
      console.log(`📝 [GP51ImportService] Importing device ${device.deviceid} for user ${userId}`);

      // Prepare device data for insertion
      const deviceRecord = {
        name: device.devicename || device.deviceid,
        device_id: device.deviceid,
        gp51_device_id: device.deviceid,
        user_id: userId,
        sim_number: device.simnum || null,
        device_type: device.devicetype || null,
        creator: device.creater || 'octopus',
        is_active: device.isfree !== 2, // isfree: 2 means inactive
        created_at: device.createtime ? new Date(device.createtime).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Store additional GP51 metadata
        gp51_metadata: {
          groupid: group.groupid,
          groupname: group.groupname,
          expirenotifytime: device.expirenotifytime,
          lastactivetime: device.lastactivetime,
          isfree: device.isfree,
          icon: device.icon,
          cartagcolor: device.cartagcolor
        }
      };

      let imported = false;
      let conflict = false;

      if (conflictResolution === 'skip') {
        // Check if device already exists
        const { data: existingDevice } = await supabase
          .from('vehicles')
          .select('id')
          .eq('gp51_device_id', device.deviceid)
          .single();

        if (existingDevice) {
          console.log(`⏭️ [GP51ImportService] Skipping existing device: ${device.deviceid}`);
          conflict = true;
          return { imported: false, conflict: true };
        }
      }

      // Insert or update the device
      const { data, error } = await supabase
        .from('vehicles')
        .upsert(deviceRecord, { 
          onConflict: 'gp51_device_id',
          ignoreDuplicates: conflictResolution === 'skip'
        })
        .select('id');

      if (error) {
        console.error(`❌ [GP51ImportService] Database error for device ${device.deviceid}:`, error);
        throw error;
      }

      if (data && data.length > 0) {
        imported = true;
        console.log(`✅ [GP51ImportService] Successfully imported device: ${device.deviceid}`);
      } else if (conflictResolution === 'skip') {
        conflict = true;
        console.log(`⚠️ [GP51ImportService] Device skipped due to conflict: ${device.deviceid}`);
      }

      return { imported, conflict };

    } catch (error) {
      console.error(`❌ [GP51ImportService] Failed to import device ${device.deviceid}:`, error);
      throw error;
    }
  }
}
