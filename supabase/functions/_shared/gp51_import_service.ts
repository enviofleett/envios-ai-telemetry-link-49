
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { GP51StandardClient, GP51Device, GP51UserDetail } from './gp51_standard_client.ts';

export interface ImportOptions {
  usernames?: string[];
  importUsers?: boolean;
  importDevices?: boolean;
  conflictResolution?: 'skip' | 'update' | 'error';
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
  private supabase: any;
  private gp51Client: GP51StandardClient;
  private isAuthenticated = false;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.gp51Client = new GP51StandardClient();
  }

  async authenticate(): Promise<void> {
    console.log('🔐 [GP51ImportService] Starting GP51 authentication...');
    
    // Get credentials from environment
    const username = Deno.env.get('GP51_ADMIN_USERNAME');
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!username || !password) {
      throw new Error('GP51 credentials not configured. Please set GP51_ADMIN_USERNAME and GP51_ADMIN_PASSWORD in Supabase secrets.');
    }

    try {
      await this.gp51Client.authenticate(username, password);
      this.isAuthenticated = true;
      
      const authInfo = this.gp51Client.getAuthenticationInfo();
      console.log(`✅ [GP51ImportService] Authentication successful:`, {
        username: authInfo.username,
        authenticatedAt: authInfo.authenticatedAt?.toISOString(),
        expiresAt: authInfo.expiresAt?.toISOString()
      });
    } catch (error) {
      console.error('❌ [GP51ImportService] Authentication failed:', error);
      this.isAuthenticated = false;
      throw new Error(`GP51 authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private ensureAuthenticated(): void {
    if (!this.isAuthenticated || !this.gp51Client.isAuthenticated()) {
      throw new Error('GP51ImportService is not authenticated. Call authenticate() first.');
    }
  }

  async performImport(options: ImportOptions = {}): Promise<ImportResult> {
    console.log('🚀 [GP51ImportService] Starting import process...');
    
    // Ensure we're authenticated
    this.ensureAuthenticated();
    
    const {
      usernames = undefined,
      importUsers = true,
      importDevices = true,
      conflictResolution = 'update'
    } = options;

    const statistics = {
      usersProcessed: 0,
      usersImported: 0,
      devicesProcessed: 0,
      devicesImported: 0,
      conflicts: 0
    };

    const errors: string[] = [];

    try {
      // Determine which usernames to process
      let targetUsernames: string[];
      
      if (usernames && usernames.length > 0) {
        targetUsernames = usernames;
        console.log(`📋 [GP51ImportService] Processing specific usernames:`, targetUsernames);
      } else {
        // Use the authenticated admin username as default
        const authInfo = this.gp51Client.getAuthenticationInfo();
        if (!authInfo.username) {
          throw new Error('No username available from authentication');
        }
        targetUsernames = [authInfo.username];
        console.log(`📋 [GP51ImportService] Processing default username:`, targetUsernames);
      }

      // Process each username
      for (const username of targetUsernames) {
        console.log(`👤 [GP51ImportService] Processing user: ${username}`);
        
        try {
          // Get complete user data from GP51
          const completeData = await this.gp51Client.getCompleteUserData(username);
          
          statistics.usersProcessed++;

          // Import user if requested
          if (importUsers && completeData.userDetail.username) {
            const userImported = await this.importUser(completeData.userDetail, conflictResolution);
            if (userImported) {
              statistics.usersImported++;
            }
          }

          // Import devices if requested
          if (importDevices && completeData.devices.length > 0) {
            console.log(`🚗 [GP51ImportService] Importing ${completeData.devices.length} devices for ${username}`);
            
            for (const device of completeData.devices) {
              statistics.devicesProcessed++;
              
              try {
                const deviceImported = await this.importDevice(device, conflictResolution);
                if (deviceImported) {
                  statistics.devicesImported++;
                }
              } catch (deviceError) {
                const errorMsg = `Failed to import device ${device.deviceid}: ${deviceError instanceof Error ? deviceError.message : 'Unknown error'}`;
                console.error(`❌ [GP51ImportService] ${errorMsg}`);
                errors.push(errorMsg);
                
                if (conflictResolution === 'error') {
                  statistics.conflicts++;
                }
              }
            }
          }

        } catch (userError) {
          const errorMsg = `Failed to process user ${username}: ${userError instanceof Error ? userError.message : 'Unknown error'}`;
          console.error(`❌ [GP51ImportService] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      const successRate = statistics.usersProcessed > 0 ? 
        ((statistics.usersImported + statistics.devicesImported) / (statistics.usersProcessed + statistics.devicesProcessed)) * 100 : 0;

      const message = `Import completed: ${statistics.usersImported} users, ${statistics.devicesImported} devices imported. Success rate: ${successRate.toFixed(1)}%`;
      
      console.log(`✅ [GP51ImportService] ${message}`);
      console.log(`📊 [GP51ImportService] Final statistics:`, statistics);

      return {
        success: errors.length === 0 || (errors.length < (statistics.usersProcessed + statistics.devicesProcessed) / 2),
        message,
        statistics,
        errors
      };

    } catch (error) {
      const errorMsg = `Import process failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51ImportService] ${errorMsg}`);
      
      return {
        success: false,
        message: errorMsg,
        statistics,
        errors: [errorMsg, ...errors]
      };
    }
  }

  private async importUser(userDetail: GP51UserDetail, conflictResolution: string): Promise<boolean> {
    try {
      const userData = {
        name: userDetail.showname || userDetail.username || 'Unknown User',
        email: userDetail.email || `${userDetail.username}@gp51.local`,
        phone: userDetail.phone,
        company: userDetail.company,
        gp51_username: userDetail.username,
        user_type: this.mapUserType(userDetail.usertype),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: existingUser } = await this.supabase
        .from('envio_users')
        .select('id')
        .eq('gp51_username', userDetail.username)
        .single();

      if (existingUser) {
        if (conflictResolution === 'skip') {
          console.log(`⏭️ [GP51ImportService] Skipping existing user: ${userDetail.username}`);
          return false;
        } else if (conflictResolution === 'update') {
          const { error } = await this.supabase
            .from('envio_users')
            .update(userData)
            .eq('gp51_username', userDetail.username);

          if (error) throw error;
          console.log(`🔄 [GP51ImportService] Updated user: ${userDetail.username}`);
          return true;
        } else {
          throw new Error(`User conflict: ${userDetail.username} already exists`);
        }
      } else {
        const { error } = await this.supabase
          .from('envio_users')
          .insert(userData);

        if (error) throw error;
        console.log(`✅ [GP51ImportService] Created user: ${userDetail.username}`);
        return true;
      }
    } catch (error) {
      console.error(`❌ [GP51ImportService] Failed to import user ${userDetail.username}:`, error);
      throw error;
    }
  }

  private async importDevice(device: GP51Device, conflictResolution: string): Promise<boolean> {
    try {
      const deviceData = {
        device_id: device.deviceid,
        device_name: device.devicename,
        device_type: device.devicetype,
        sim_number: device.simnum,
        last_active_time: device.lastactivetime ? new Date(device.lastactivetime * 1000).toISOString() : null,
        creator: device.creater,
        remark: device.remark,
        is_free: device.isfree === 1,
        allow_edit: device.allowedit === 1,
        icon: device.icon,
        starred: device.stared === 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: existingDevice } = await this.supabase
        .from('vehicles')
        .select('id')
        .eq('gp51_device_id', device.deviceid)
        .single();

      if (existingDevice) {
        if (conflictResolution === 'skip') {
          console.log(`⏭️ [GP51ImportService] Skipping existing device: ${device.deviceid}`);
          return false;
        } else if (conflictResolution === 'update') {
          const { error } = await this.supabase
            .from('vehicles')
            .update(deviceData)
            .eq('gp51_device_id', device.deviceid);

          if (error) throw error;
          console.log(`🔄 [GP51ImportService] Updated device: ${device.deviceid}`);
          return true;
        } else {
          throw new Error(`Device conflict: ${device.deviceid} already exists`);
        }
      } else {
        const { error } = await this.supabase
          .from('vehicles')
          .insert({
            ...deviceData,
            gp51_device_id: device.deviceid,
            make: 'GP51 Device',
            model: device.devicename || 'Unknown Model',
            year: new Date().getFullYear(),
            license_plate: device.deviceid
          });

        if (error) throw error;
        console.log(`✅ [GP51ImportService] Created device: ${device.deviceid}`);
        return true;
      }
    } catch (error) {
      console.error(`❌ [GP51ImportService] Failed to import device ${device.deviceid}:`, error);
      throw error;
    }
  }

  private mapUserType(usertype?: number): string {
    switch (usertype) {
      case 1: return 'admin';
      case 2: return 'operator';
      case 3: return 'viewer';
      default: return 'user';
    }
  }
}
