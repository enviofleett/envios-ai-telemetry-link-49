
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

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.gp51Client = new GP51StandardClient();
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

    this.errors = []; // Reset errors for this import

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

            // Actually import user data (not skip mode)
            if (options.conflictResolution !== 'skip') {
              const importResult = await this.importUserToSupabase(userDetailsResult.data, options.conflictResolution || 'update');
              if (importResult) {
                statistics.usersImported++;
                console.log(`✅ [GP51ImportService] Successfully imported user: ${username}`);
              } else {
                this.errors.push(`Failed to import user: ${username}`);
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
            console.log(`📊 [GP51ImportService] Found ${devices.length} devices to process`);

            // Actually import devices (not skip mode)
            if (options.conflictResolution !== 'skip') {
              const batchSize = 50; // Process in batches to avoid overwhelming the database
              for (let i = 0; i < devices.length; i += batchSize) {
                const batch = devices.slice(i, i + batchSize);
                console.log(`📦 [GP51ImportService] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(devices.length / batchSize)} (${batch.length} devices)`);
                
                for (const device of batch) {
                  try {
                    const importResult = await this.importDeviceToSupabase(device, options.conflictResolution || 'update');
                    if (importResult) {
                      statistics.devicesImported++;
                    } else {
                      this.errors.push(`Failed to import device: ${device.deviceid}`);
                    }
                  } catch (error) {
                    const errorMsg = `Failed to import device ${device.deviceid}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    console.error(`❌ [GP51ImportService] ${errorMsg}`);
                    this.errors.push(errorMsg);
                  }
                }
              }
            }
          }

        } catch (error) {
          const errorMsg = `Failed to process devices: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ [GP51ImportService] ${errorMsg}`);
          this.errors.push(errorMsg);
        }
      }

      console.log('📊 [GP51ImportService] Final statistics:', statistics);
      console.log('📊 [GP51ImportService] Total errors:', this.errors.length);

      const successRate = statistics.usersProcessed + statistics.devicesProcessed > 0 
        ? ((statistics.usersImported + statistics.devicesImported) / (statistics.usersProcessed + statistics.devicesProcessed) * 100).toFixed(1)
        : '0.0';

      const message = statistics.devicesImported > 0 || statistics.usersImported > 0
        ? `Import completed: ${statistics.usersImported} users, ${statistics.devicesImported} devices imported. Success rate: ${successRate}%`
        : 'Import completed but no data was imported. Check GP51 connection and credentials.';

      console.log(`✅ [GP51ImportService] ${message}`);

      return {
        success: statistics.usersImported > 0 || statistics.devicesImported > 0 || this.errors.length === 0,
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
      console.log(`📝 [GP51ImportService] Importing user: ${userData.username || 'unknown'}`);
      
      // Create user data structure for Supabase
      const userRecord = {
        email: userData.email || `${userData.username}@gp51.import`,
        username: userData.username,
        gp51_user_id: userData.username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert into envio_users table (or your equivalent users table)
      const { data, error } = await this.supabase
        .from('envio_users')
        .upsert(userRecord, { 
          onConflict: 'gp51_user_id',
          ignoreDuplicates: conflictMode === 'skip'
        });

      if (error) {
        console.error(`❌ [GP51ImportService] Failed to import user ${userData.username}:`, error);
        return false;
      }

      console.log(`✅ [GP51ImportService] User ${userData.username} imported successfully`);
      return true;
    } catch (error) {
      console.error(`❌ [GP51ImportService] Failed to import user:`, error);
      return false;
    }
  }

  private async importDeviceToSupabase(deviceData: any, conflictMode: string): Promise<boolean> {
    try {
      console.log(`📝 [GP51ImportService] Importing device: ${deviceData.deviceid}`);
      
      // Create device data structure for Supabase
      const deviceRecord = {
        gp51_device_id: deviceData.deviceid,
        name: deviceData.devicename || deviceData.deviceid,
        device_type: deviceData.devicetype || 0,
        sim_number: deviceData.simnum || null,
        last_active_time: deviceData.lastactivetime ? new Date(deviceData.lastactivetime * 1000).toISOString() : null,
        creator: deviceData.creater || 'octopus',
        remark: deviceData.remark || null,
        is_free: deviceData.isfree === 1,
        allow_edit: deviceData.allowedit === 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert into vehicles table
      const { data, error } = await this.supabase
        .from('vehicles')
        .upsert(deviceRecord, { 
          onConflict: 'gp51_device_id',
          ignoreDuplicates: conflictMode === 'skip'
        });

      if (error) {
        console.error(`❌ [GP51ImportService] Failed to import device ${deviceData.deviceid}:`, error);
        return false;
      }

      console.log(`✅ [GP51ImportService] Device ${deviceData.deviceid} imported successfully`);
      return true;
    } catch (error) {
      console.error(`❌ [GP51ImportService] Failed to import device:`, error);
      return false;
    }
  }
}
