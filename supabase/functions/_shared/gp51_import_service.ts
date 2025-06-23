import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface ImportOptions {
  usernames?: string[];
  importUsers?: boolean;
  importDevices?: boolean;
  conflictResolution?: 'skip' | 'update' | 'overwrite';
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
  private gp51Token: string | null = null;
  private adminUserUuid: string | null = null;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  private async fetchAdminUserUuid(): Promise<string> {
    console.log('🔍 [GP51ImportService] Fetching admin user UUID for username: octopus');
    
    const { data: adminUser, error: userFetchError } = await this.supabase
      .from('envio_users')
      .select('id')
      .eq('name', 'octopus')
      .maybeSingle();

    if (userFetchError) {
      console.error('❌ [GP51ImportService] Error fetching admin user:', userFetchError);
      throw new Error(`Failed to fetch admin user: ${userFetchError.message}`);
    }

    if (!adminUser) {
      console.error('❌ [GP51ImportService] Admin user "octopus" not found in envio_users table');
      throw new Error('Admin user "octopus" not found. Please ensure the user exists in the system.');
    }

    console.log('✅ [GP51ImportService] Admin user UUID found:', adminUser.id);
    this.adminUserUuid = adminUser.id;
    return adminUser.id;
  }

  async authenticate(): Promise<void> {
    const username = Deno.env.get('GP51_ADMIN_USERNAME');
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');

    if (!username || !password) {
      throw new Error('GP51 credentials not configured');
    }

    console.log('🔐 [GP51ImportService] Authenticating with GP51...');
    const loginData = {
      action: 'login',
      username: username,
      password: password,
      from: 'WEB',
      type: 'USER'
    };

    const response = await fetch('https://www.gps51.com/webapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(loginData).toString()
    });

    if (!response.ok) {
      throw new Error(`GP51 authentication failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.status !== 0) {
      throw new Error(`GP51 authentication failed: ${result.cause || 'Unknown error'}`);
    }

    this.gp51Token = result.token;
    console.log('✅ [GP51ImportService] GP51 authentication successful');
  }

  async performImport(options: ImportOptions): Promise<ImportResult> {
    const statistics: ImportStatistics = {
      usersProcessed: 0,
      usersImported: 0,
      devicesProcessed: 0,
      devicesImported: 0,
      conflicts: 0
    };
    const errors: string[] = [];

    try {
      // Fetch admin user UUID before starting import
      await this.fetchAdminUserUuid();

      if (!this.gp51Token) {
        throw new Error('Not authenticated with GP51');
      }

      console.log('🚀 [GP51ImportService] Starting import process...');

      // Fetch devices from GP51
      const devices = await this.fetchDevicesFromGP51();
      console.log(`📦 [GP51ImportService] Fetched ${devices.length} devices from GP51`);

      if (options.importDevices && devices.length > 0) {
        const deviceImportResult = await this.importDevicesToSupabase(devices, options.conflictResolution || 'update');
        statistics.devicesProcessed = deviceImportResult.processed;
        statistics.devicesImported = deviceImportResult.imported;
        errors.push(...deviceImportResult.errors);
      }

      // Fetch users from GP51 if needed
      if (options.importUsers) {
        const users = await this.fetchUsersFromGP51();
        console.log(`👥 [GP51ImportService] Fetched ${users.length} users from GP51`);

        if (users.length > 0) {
          const userImportResult = await this.importUsersToSupabase(users, options.conflictResolution || 'update');
          statistics.usersProcessed = userImportResult.processed;
          statistics.usersImported = userImportResult.imported;
          errors.push(...userImportResult.errors);
        }
      }

      const totalImported = statistics.devicesImported + statistics.usersImported;
      const success = totalImported > 0;

      return {
        success,
        message: success 
          ? `Import completed successfully. Imported ${statistics.devicesImported} devices and ${statistics.usersImported} users.`
          : 'Import completed but no items were imported. Check error logs for details.',
        statistics,
        errors
      };

    } catch (error) {
      console.error('❌ [GP51ImportService] Import failed:', error);
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        statistics,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async fetchDevicesFromGP51(): Promise<any[]> {
    if (!this.gp51Token) {
      throw new Error('No GP51 token available');
    }

    const devicesData = {
      action: 'getmonitorlist',
      token: this.gp51Token
    };

    const response = await fetch('https://www.gps51.com/webapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(devicesData).toString()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch devices: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.status !== 0) {
      throw new Error(`GP51 devices fetch failed: ${result.cause || 'Unknown error'}`);
    }

    const devices: any[] = [];
    if (result.groups && Array.isArray(result.groups)) {
      for (const group of result.groups) {
        if (group.devices && Array.isArray(group.devices)) {
          devices.push(...group.devices);
        }
      }
    }

    return devices;
  }

  private async fetchUsersFromGP51(): Promise<any[]> {
    if (!this.gp51Token) {
      throw new Error('No GP51 token available');
    }

    const usersData = {
      action: 'getuserlist',
      token: this.gp51Token
    };

    const response = await fetch('https://www.gps51.com/webapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(usersData).toString()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.status !== 0) {
      throw new Error(`GP51 users fetch failed: ${result.cause || 'Unknown error'}`);
    }

    return result.users || [];
  }

  private async importDevicesToSupabase(devices: any[], conflictResolution: string): Promise<{processed: number, imported: number, errors: string[]}> {
    const errors: string[] = [];
    let imported = 0;
    const BATCH_SIZE = 50;

    if (!this.adminUserUuid) {
      throw new Error('Admin user UUID not available. Cannot proceed with device import.');
    }

    console.log(`🚗 [GP51ImportService] Starting device import with admin user: ${this.adminUserUuid}`);

    // Process devices in batches
    for (let i = 0; i < devices.length; i += BATCH_SIZE) {
      const batch = devices.slice(i, i + BATCH_SIZE);
      console.log(`📦 [GP51ImportService] Processing device batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(devices.length/BATCH_SIZE)} (${batch.length} devices)`);

      const vehiclesToImport = batch.map(device => ({
        gp51_device_id: device.deviceid,
        name: device.devicename || device.deviceid,
        user_id: this.adminUserUuid, // Use the fetched UUID
        sim_number: device.simnum || '',
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

      console.log(`🚗 [GP51ImportService] Preparing batch upsert for ${vehiclesToImport.length} devices`);
      console.log(`📊 [GP51ImportService] Sample vehicle record structure:`, JSON.stringify(vehiclesToImport[0], null, 2));

      try {
        console.log(`📝 [GP51ImportService] Attempting to upsert ${vehiclesToImport.length} vehicles to admin user: ${this.adminUserUuid}`);

        const { data: vehicleData, error: vehicleError } = await this.supabase
          .from('vehicles')
          .upsert(vehiclesToImport, { 
            onConflict: 'gp51_device_id',
            ignoreDuplicates: conflictResolution === 'skip'
          })
          .select('id');

        if (vehicleError) {
          console.error(`❌ [GP51ImportService] Vehicle batch upsert FAILED:`, vehicleError);
          console.error(`📋 [GP51ImportService] Vehicle upsert error details:`, vehicleError.details);
          console.error(`💡 [GP51ImportService] Vehicle upsert error hint:`, vehicleError.hint);
          errors.push(`Batch ${Math.floor(i/BATCH_SIZE) + 1} failed: ${vehicleError.message}`);
        } else {
          const batchImported = vehicleData?.length || 0;
          imported += batchImported;
          console.log(`✅ [GP51ImportService] Successfully upserted ${batchImported} vehicles in batch ${Math.floor(i/BATCH_SIZE) + 1}`);
        }
      } catch (error) {
        console.error(`❌ [GP51ImportService] Batch ${Math.floor(i/BATCH_SIZE) + 1} error:`, error);
        errors.push(`Batch ${Math.floor(i/BATCH_SIZE) + 1} error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ [GP51ImportService] Device import completed. Total imported: ${imported}/${devices.length}`);

    return {
      processed: devices.length,
      imported,
      errors
    };
  }

  private async importUsersToSupabase(users: any[], conflictResolution: string): Promise<{processed: number, imported: number, errors: string[]}> {
    const errors: string[] = [];
    let imported = 0;
    const BATCH_SIZE = 50;

    console.log(`👥 [GP51ImportService] Starting user import...`);

    // Process users in batches
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      console.log(`📦 [GP51ImportService] Processing user batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(users.length/BATCH_SIZE)} (${batch.length} users)`);

      const usersToImport = batch.map(user => ({
        name: user.loginame || user.username,
        email: user.email || `${user.loginame}@gp51.local`,
        phone_number: user.phone || null,
        city: user.city || null,
        gp51_username: user.loginame,
        gp51_user_type: user.usertype || 0,
        registration_status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      console.log(`👥 [GP51ImportService] Preparing batch upsert for ${usersToImport.length} users`);

      try {
        const { data: userData, error: userError } = await this.supabase
          .from('envio_users')
          .upsert(usersToImport, { 
            onConflict: 'gp51_username',
            ignoreDuplicates: conflictResolution === 'skip'
          })
          .select('id');

        if (userError) {
          console.error(`❌ [GP51ImportService] User batch upsert FAILED:`, userError);
          errors.push(`User batch ${Math.floor(i/BATCH_SIZE) + 1} failed: ${userError.message}`);
        } else {
          const batchImported = userData?.length || 0;
          imported += batchImported;
          console.log(`✅ [GP51ImportService] Successfully upserted ${batchImported} users in batch ${Math.floor(i/BATCH_SIZE) + 1}`);
        }
      } catch (error) {
        console.error(`❌ [GP51ImportService] User batch ${Math.floor(i/BATCH_SIZE) + 1} error:`, error);
        errors.push(`User batch ${Math.floor(i/BATCH_SIZE) + 1} error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ [GP51ImportService] User import completed. Total imported: ${imported}/${users.length}`);

    return {
      processed: users.length,
      imported,
      errors
    };
  }
}
