import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
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
  private errors: string[] = [];
  private adminUserId: string;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.gp51Client = new GP51StandardClient();
    
    // Get admin user ID from environment variable
    this.adminUserId = Deno.env.get('GP51_ADMIN_USER_ID') || '';
    if (!this.adminUserId) {
      console.warn('⚠️ [GP51ImportService] GP51_ADMIN_USER_ID not configured - imports may fail');
    }
  }

  async authenticate(): Promise<void> {
    console.log('🔐 [GP51ImportService] Starting GP51 authentication...');
    
    const username = Deno.env.get('GP51_ADMIN_USERNAME');
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!username || !password) {
      throw new Error('GP51 credentials not configured');
    }

    const authResult = await this.gp51Client.authenticate(username, password);
    
    if (!authResult.success) {
      throw new Error(`Authentication failed: ${authResult.error || 'Unknown error'}`);
    }

    console.log('✅ [GP51ImportService] Authentication successful:', {
      username: authResult.username,
      authenticatedAt: new Date().toISOString(),
      expiresAt: authResult.expiresAt
    });
  }

  async performImport(options: ImportOptions): Promise<ImportResult> {
    console.log('🚀 [GP51ImportService] Starting import process...');
    
    const statistics: ImportStatistics = {
      usersProcessed: 0,
      usersImported: 0,
      devicesProcessed: 0,
      devicesImported: 0,
      conflicts: 0
    };

    try {
      // Process users if requested
      if (options.importUsers !== false) {
        const usernames = options.usernames || ['octopus']; // Default to admin user
        console.log('📋 [GP51ImportService] Processing usernames:', usernames);
        
        for (const username of usernames) {
          try {
            console.log(`👤 [GP51ImportService] Processing user: ${username}`);
            
            // Get user details from GP51
            const userDetailsResult = await this.gp51Client.queryUserDetail(username);
            
            if (!userDetailsResult.success) {
              console.error(`❌ [GP51ImportService] Failed to get user details for ${username}:`, userDetailsResult.error);
              this.errors.push(`Failed to get user details for ${username}: ${userDetailsResult.error}`);
              continue;
            }

            statistics.usersProcessed++;

            // Process user data (skip import for preview mode)
            if (options.conflictResolution !== 'skip') {
              const importResult = await this.importUserToSupabase(userDetailsResult.data, options.conflictResolution);
              if (importResult) {
                statistics.usersImported++;
              }
            }

          } catch (error) {
            const errorMsg = `Failed to process user ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`❌ [GP51ImportService] ${errorMsg}`);
            this.errors.push(errorMsg);
          }
        }
      }

      // Process devices if requested
      if (options.importDevices !== false) {
        try {
          console.log('🚗 [GP51ImportService] Processing devices...');
          
          // Get monitor list (devices) from GP51
          const monitorListResult = await this.gp51Client.queryMonitorList();
          
          if (!monitorListResult.success) {
            console.error('❌ [GP51ImportService] Failed to get monitor list:', monitorListResult.error);
            this.errors.push(`Failed to get devices: ${monitorListResult.error}`);
          } else {
            const devices = this.extractDevicesFromMonitorList(monitorListResult.data);
            statistics.devicesProcessed = devices.length;

            // Process devices (skip import for preview mode)
            if (options.conflictResolution !== 'skip') {
              let successCount = 0;
              
              // Process devices in batches for better performance
              const batchSize = 50;
              for (let i = 0; i < devices.length; i += batchSize) {
                const batch = devices.slice(i, i + batchSize);
                console.log(`📦 [GP51ImportService] Processing device batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(devices.length/batchSize)} (${batch.length} devices)`);
                
                const batchResults = await this.importDeviceBatchToSupabase(batch, options.conflictResolution);
                successCount += batchResults;
              }
              
              statistics.devicesImported = successCount;
            }
          }

        } catch (error) {
          const errorMsg = `Failed to process devices: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ [GP51ImportService] ${errorMsg}`);
          this.errors.push(errorMsg);
        }
      }

      console.log('📊 [GP51ImportService] Final statistics:', statistics);

      const successRate = statistics.usersProcessed + statistics.devicesProcessed > 0 
        ? ((statistics.usersImported + statistics.devicesImported) / (statistics.usersProcessed + statistics.devicesProcessed) * 100).toFixed(1)
        : '0.0';

      const message = `Import completed: ${statistics.usersImported} users, ${statistics.devicesImported} devices imported. Success rate: ${successRate}%`;
      console.log(`✅ [GP51ImportService] ${message}`);

      return {
        success: true,
        message,
        statistics,
        errors: this.errors
      };

    } catch (error) {
      const errorMsg = `Import process failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51ImportService] ${errorMsg}`);
      
      return {
        success: false,
        message: errorMsg,
        statistics,
        errors: [...this.errors, errorMsg]
      };
    }
  }

  private extractDevicesFromMonitorList(monitorListData: any): any[] {
    const devices: any[] = [];
    
    if (monitorListData.groups && Array.isArray(monitorListData.groups)) {
      for (const group of monitorListData.groups) {
        if (group.devices && Array.isArray(group.devices)) {
          devices.push(...group.devices);
        }
      }
    }
    
    console.log(`📊 [GP51ImportService] Extracted ${devices.length} devices from monitor list`);
    return devices;
  }

  private async importUserToSupabase(userData: any, conflictMode: string): Promise<boolean> {
    try {
      console.log(`👤 [GP51ImportService] Importing user: ${userData.username}`);
      
      // Map GP51 user data to Supabase envio_users schema
      const userRecord = {
        name: userData.showname || userData.username,
        email: userData.email || `${userData.username}@gp51.import`,
        // Store additional GP51 data in metadata
        gp51_metadata: {
          username: userData.username,
          usertype: userData.usertype,
          createtime: userData.createtime,
          creater: userData.creater,
          phone: userData.phone || '',
          qq: userData.qq || '',
          wechat: userData.wechat || ''
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log(`📝 [GP51ImportService] Preparing user upsert for: ${userData.username}`);
      console.log(`📊 [GP51ImportService] User data structure:`, JSON.stringify(userRecord, null, 2));

      const { data: upsertData, error: upsertError } = await this.supabase
        .from('envio_users')
        .upsert(userRecord, { 
          onConflict: 'email',
          ignoreDuplicates: conflictMode === 'skip'
        })
        .select();

      if (upsertError) {
        console.error(`❌ [GP51ImportService] User upsert FAILED for ${userData.username}:`, upsertError);
        console.error(`📋 [GP51ImportService] User upsert error details:`, upsertError.details);
        console.error(`💡 [GP51ImportService] User upsert error hint:`, upsertError.hint);
        this.errors.push(`User import failed for ${userData.username}: ${upsertError.message}`);
        return false;
      }

      console.log(`✅ [GP51ImportService] User upsert SUCCESS for ${userData.username}. Records affected: ${upsertData?.length || 0}`);
      return true;

    } catch (error) {
      const errorMsg = `Failed to import user ${userData.username}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51ImportService] ${errorMsg}`);
      this.errors.push(errorMsg);
      return false;
    }
  }

  private async importDeviceBatchToSupabase(deviceBatch: any[], conflictMode: string): Promise<number> {
    try {
      console.log(`🚗 [GP51ImportService] Preparing batch upsert for ${deviceBatch.length} devices`);
      
      // Map GP51 device data to Supabase vehicles schema
      const vehicleRecords = deviceBatch.map(device => ({
        gp51_device_id: device.deviceid,
        name: device.devicename || device.deviceid,
        user_id: this.adminUserId, // Assign to admin user
        sim_number: device.simnum || null,
        // Store additional GP51 metadata
        gp51_metadata: {
          devicetype: device.devicetype,
          createtime: device.createtime,
          creater: device.creater,
          lastactivetime: device.lastactivetime,
          isfree: device.isfree,
          allowedit: device.allowedit,
          expirenotifytime: device.expirenotifytime,
          remark: device.remark,
          icon: device.icon
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      console.log(`📊 [GP51ImportService] Sample vehicle record structure:`, JSON.stringify(vehicleRecords[0], null, 2));
      console.log(`📝 [GP51ImportService] Attempting to upsert ${vehicleRecords.length} vehicles to admin user: ${this.adminUserId}`);

      const { data: upsertData, error: upsertError } = await this.supabase
        .from('vehicles')
        .upsert(vehicleRecords, { 
          onConflict: 'gp51_device_id',
          ignoreDuplicates: conflictMode === 'skip'
        })
        .select();

      if (upsertError) {
        console.error(`❌ [GP51ImportService] Vehicle batch upsert FAILED:`, upsertError);
        console.error(`📋 [GP51ImportService] Vehicle upsert error details:`, upsertError.details);
        console.error(`💡 [GP51ImportService] Vehicle upsert error hint:`, upsertError.hint);
        this.errors.push(`Device batch import failed: ${upsertError.message}`);
        return 0;
      }

      const successCount = upsertData?.length || 0;
      console.log(`✅ [GP51ImportService] Vehicle batch upsert SUCCESS. Records affected: ${successCount}`);
      
      return successCount;

    } catch (error) {
      const errorMsg = `Failed to import device batch: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51ImportService] ${errorMsg}`);
      this.errors.push(errorMsg);
      return 0;
    }
  }

  private async importDeviceToSupabase(deviceData: any, conflictMode: string): Promise<boolean> {
    // This method is now replaced by importDeviceBatchToSupabase for better performance
    // But keeping it for backward compatibility
    const result = await this.importDeviceBatchToSupabase([deviceData], conflictMode);
    return result > 0;
  }
}
