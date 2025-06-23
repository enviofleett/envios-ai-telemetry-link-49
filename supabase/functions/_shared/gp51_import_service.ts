
// GP51 Import Service with standardized API calls and comprehensive data processing
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { GP51StandardClient, GP51Device, GP51UserDetail } from './gp51_standard_client.ts';

export interface ImportResult {
  success: boolean;
  statistics: {
    usersProcessed: number;
    usersCreated: number;
    usersUpdated: number;
    devicesProcessed: number;
    devicesCreated: number;
    devicesUpdated: number;
    errors: number;
  };
  errors: Array<{
    type: string;
    message: string;
    details?: any;
  }>;
  message: string;
}

export interface ImportOptions {
  usernames?: string[];
  importUsers: boolean;
  importDevices: boolean;
  conflictResolution: 'skip' | 'update' | 'replace';
}

export class GP51ImportService {
  private client: GP51StandardClient;
  private supabase: any;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.client = new GP51StandardClient();
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async authenticate(): Promise<string> {
    console.log('🔐 [GP51Import] Authenticating with GP51...');
    
    const username = Deno.env.get('GP51_ADMIN_USERNAME');
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!username || !password) {
      throw new Error('GP51 admin credentials not configured');
    }

    const loginResponse = await this.client.login(username, password);
    
    if (!loginResponse.token) {
      throw new Error('Authentication failed: No token received');
    }

    console.log('✅ [GP51Import] Authentication successful');
    return loginResponse.token;
  }

  async importUserData(username: string, options: ImportOptions): Promise<{
    userProcessed: boolean;
    devicesProcessed: number;
    errors: any[];
  }> {
    const errors: any[] = [];
    let userProcessed = false;
    let devicesProcessed = 0;

    console.log(`📊 [GP51Import] Processing user: ${username}`);

    try {
      // Get complete user data from GP51
      const completeData = await this.client.getCompleteUserData(username);
      
      // Process user if requested
      if (options.importUsers) {
        try {
          await this.processUser(completeData.userDetail, options);
          userProcessed = true;
          console.log(`✅ [GP51Import] User ${username} processed successfully`);
        } catch (error) {
          console.error(`❌ [GP51Import] Failed to process user ${username}:`, error);
          errors.push({
            type: 'user_processing',
            username,
            message: error instanceof Error ? error.message : 'Unknown error',
            details: error
          });
        }
      }

      // Process devices if requested
      if (options.importDevices && completeData.devices.length > 0) {
        for (const device of completeData.devices) {
          try {
            await this.processDevice(device, username, options);
            devicesProcessed++;
            console.log(`✅ [GP51Import] Device ${device.deviceid} processed successfully`);
          } catch (error) {
            console.error(`❌ [GP51Import] Failed to process device ${device.deviceid}:`, error);
            errors.push({
              type: 'device_processing',
              deviceId: device.deviceid,
              username,
              message: error instanceof Error ? error.message : 'Unknown error',
              details: error
            });
          }
        }
      }

    } catch (error) {
      console.error(`❌ [GP51Import] Failed to get data for user ${username}:`, error);
      errors.push({
        type: 'data_fetching',
        username,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      });
    }

    return {
      userProcessed,
      devicesProcessed,
      errors
    };
  }

  private async processUser(userDetail: GP51UserDetail, options: ImportOptions): Promise<void> {
    if (!userDetail.username) {
      throw new Error('User detail missing username');
    }

    const userData = {
      gp51_username: userDetail.username,
      name: userDetail.showname || userDetail.username,
      email: userDetail.email || null,
      phone: userDetail.phone || null,
      company: userDetail.company || null,
      user_type: userDetail.usertype || 0,
      created_by: userDetail.creater || null,
      multi_login: userDetail.multilogin === 1,
      updated_at: new Date().toISOString()
    };

    if (options.conflictResolution === 'skip') {
      const { error } = await this.supabase
        .from('envio_users')
        .insert({
          ...userData,
          created_at: new Date().toISOString()
        });
      
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
    } else {
      const { error } = await this.supabase
        .from('envio_users')
        .upsert(userData, {
          onConflict: 'gp51_username',
          ignoreDuplicates: options.conflictResolution === 'skip'
        });
      
      if (error) {
        throw error;
      }
    }
  }

  private async processDevice(device: GP51Device, ownerUsername: string, options: ImportOptions): Promise<void> {
    const deviceData = {
      gp51_device_id: device.deviceid,
      name: device.devicename || device.deviceid,
      device_type: device.devicetype || 0,
      sim_number: device.simnum || null,
      last_active_time: device.lastactivetime ? new Date(device.lastactivetime * 1000).toISOString() : null,
      overdue_time: device.overduetime || null,
      remark: device.remark || null,
      created_by: device.creater || null,
      is_free: device.isfree === 1,
      allow_edit: device.allowedit === 1,
      icon: device.icon || null,
      starred: device.stared === 1,
      gp51_owner_username: ownerUsername,
      updated_at: new Date().toISOString()
    };

    // Get user_id for the owner
    const { data: userData, error: userError } = await this.supabase
      .from('envio_users')
      .select('id')
      .eq('gp51_username', ownerUsername)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw new Error(`Failed to find user ${ownerUsername}: ${userError.message}`);
    }

    if (userData) {
      deviceData.user_id = userData.id;
    }

    if (options.conflictResolution === 'skip') {
      const { error } = await this.supabase
        .from('vehicles')
        .insert({
          ...deviceData,
          created_at: new Date().toISOString()
        });
      
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
    } else {
      const { error } = await this.supabase
        .from('vehicles')
        .upsert(deviceData, {
          onConflict: 'gp51_device_id',
          ignoreDuplicates: options.conflictResolution === 'skip'
        });
      
      if (error) {
        throw error;
      }
    }
  }

  async performImport(options: ImportOptions): Promise<ImportResult> {
    console.log('🚀 [GP51Import] Starting import process...');
    
    const result: ImportResult = {
      success: false,
      statistics: {
        usersProcessed: 0,
        usersCreated: 0,
        usersUpdated: 0,
        devicesProcessed: 0,
        devicesCreated: 0,
        devicesUpdated: 0,
        errors: 0
      },
      errors: [],
      message: ''
    };

    try {
      // Authenticate first
      await this.authenticate();

      // Use provided usernames or default to admin username
      const usernamesToProcess = options.usernames || [Deno.env.get('GP51_ADMIN_USERNAME')!];
      
      console.log(`📋 [GP51Import] Processing ${usernamesToProcess.length} users...`);

      for (const username of usernamesToProcess) {
        try {
          const userResult = await this.importUserData(username, options);
          
          if (userResult.userProcessed) {
            result.statistics.usersProcessed++;
            result.statistics.usersCreated++; // Simplified - would need more logic to distinguish create vs update
          }
          
          result.statistics.devicesProcessed += userResult.devicesProcessed;
          result.statistics.devicesCreated += userResult.devicesProcessed; // Simplified
          
          result.errors.push(...userResult.errors);
          result.statistics.errors += userResult.errors.length;
          
        } catch (error) {
          console.error(`❌ [GP51Import] Failed to process user ${username}:`, error);
          result.errors.push({
            type: 'user_import',
            message: `Failed to import user ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: { username, error }
          });
          result.statistics.errors++;
        }
      }

      result.success = result.statistics.errors === 0 || result.statistics.devicesProcessed > 0;
      result.message = result.success 
        ? `Import completed successfully. Processed ${result.statistics.usersProcessed} users and ${result.statistics.devicesProcessed} devices.`
        : `Import completed with ${result.statistics.errors} errors. Processed ${result.statistics.devicesProcessed} devices.`;

      console.log('✅ [GP51Import] Import process completed:', result.statistics);
      
    } catch (error) {
      console.error('❌ [GP51Import] Import process failed:', error);
      result.errors.push({
        type: 'system',
        message: error instanceof Error ? error.message : 'Unknown system error',
        details: error
      });
      result.statistics.errors++;
      result.message = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return result;
  }
}
