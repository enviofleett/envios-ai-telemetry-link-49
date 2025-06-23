
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
              for (const device of devices) {
                try {
                  const importResult = await this.importDeviceToSupabase(device, options.conflictResolution);
                  if (importResult) {
                    statistics.devicesImported++;
                  }
                } catch (error) {
                  const errorMsg = `Failed to import device ${device.deviceid}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                  console.error(`❌ [GP51ImportService] ${errorMsg}`);
                  this.errors.push(errorMsg);
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
      // Import user logic would go here
      // For now, just return true to indicate successful processing
      console.log(`✅ [GP51ImportService] User ${userData.username} processed successfully`);
      return true;
    } catch (error) {
      console.error(`❌ [GP51ImportService] Failed to import user:`, error);
      return false;
    }
  }

  private async importDeviceToSupabase(deviceData: any, conflictMode: string): Promise<boolean> {
    try {
      // Import device logic would go here
      // For now, just return true to indicate successful processing
      console.log(`✅ [GP51ImportService] Device ${deviceData.deviceid} processed successfully`);
      return true;
    } catch (error) {
      console.error(`❌ [GP51ImportService] Failed to import device:`, error);
      return false;
    }
  }
}
