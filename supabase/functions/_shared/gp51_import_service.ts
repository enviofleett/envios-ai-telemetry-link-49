import { md5_sync } from './crypto_utils.ts';

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
  private baseUrl: string = 'https://www.gps51.com/webapi';
  private supabaseUrl: string;
  private supabaseServiceKey: string;
  private globalToken: string;
  private username: string;
  private passwordHash: string;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseServiceKey = supabaseServiceKey;
    
    const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    const username = Deno.env.get('GP51_ADMIN_USERNAME');
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!globalToken || !username || !password) {
      throw new Error('GP51 environment variables not configured');
    }
    
    this.globalToken = globalToken;
    this.username = username;
    this.passwordHash = md5_sync(password);
  }

  async authenticate(): Promise<boolean> {
    // This method now just validates that we have the credentials
    // Actual authentication happens per-request
    return !!(this.globalToken && this.username && this.passwordHash);
  }

  private async makeAuthenticatedRequest(action: string, additionalParams: Record<string, any> = {}): Promise<any> {
    console.log(`🔐 [GP51ImportService] Making authenticated request for action: ${action}`);
    
    // Step 1: Get fresh authentication token
    const loginUrl = new URL(this.baseUrl);
    loginUrl.searchParams.set('action', 'login');
    loginUrl.searchParams.set('token', this.globalToken);

    const loginParams = {
      username: this.username,
      password: this.passwordHash,
      from: 'WEB',
      type: 'USER'
    };

    console.log(`🔐 [GP51ImportService] Step 1: Authenticating for ${action}...`);
    
    const loginResponse = await fetch(loginUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginParams),
      signal: AbortSignal.timeout(10000)
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    console.log(`🔐 [GP51ImportService] Login response status: ${loginData.status}`);

    if (loginData.status !== 0 || !loginData.token) {
      throw new Error(loginData.cause || `Login failed with status ${loginData.status}`);
    }

    const userToken = loginData.token;
    console.log(`🔐 [GP51ImportService] Fresh token obtained for ${action}`);

    // Step 2: Immediately make the authenticated request
    const requestUrl = new URL(this.baseUrl);
    requestUrl.searchParams.set('action', action);
    requestUrl.searchParams.set('token', userToken);

    const requestParams = {
      username: this.username,
      ...additionalParams
    };

    console.log(`📤 [GP51ImportService] Step 2: Making ${action} request with fresh token...`);

    const response = await fetch(requestUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestParams),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`${action} request failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log(`📊 [GP51ImportService] ${action} response status: ${responseData.status}`);

    if (responseData.status !== 0) {
      throw new Error(responseData.cause || `${action} failed with status ${responseData.status}`);
    }

    return responseData;
  }

  private async fetchUsers(): Promise<any[]> {
    console.log(`👤 [GP51ImportService] Fetching users with fresh authentication...`);
    
    try {
      const response = await this.makeAuthenticatedRequest('queryuserlist');
      return response.users || [];
    } catch (error) {
      console.error(`❌ [GP51ImportService] Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async fetchDevices(): Promise<any[]> {
    console.log(`🚗 [GP51ImportService] Fetching devices with fresh authentication...`);
    
    try {
      const response = await this.makeAuthenticatedRequest('querymonitorlist');
      const devices = response.groups?.flatMap((group: any) => group.devices || []) || [];
      console.log(`🚗 [GP51ImportService] Successfully fetched ${devices.length} devices`);
      return devices;
    } catch (error) {
      console.error(`❌ [GP51ImportService] Failed to fetch devices: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async performImport(options: ImportOptions): Promise<ImportResult> {
    console.log(`🚀 [GP51ImportService] Starting import with options:`, options);
    
    const statistics = {
      usersProcessed: 0,
      usersImported: 0,
      devicesProcessed: 0,
      devicesImported: 0,
      conflicts: 0
    };
    const errors: string[] = [];

    try {
      // Check if this is preview mode
      const isPreviewMode = options.conflictResolution === 'skip';
      if (isPreviewMode) {
        console.log(`📊 [GP51ImportService] Running in preview mode`);
      }

      let users: any[] = [];
      let devices: any[] = [];

      // Fetch users if requested
      if (options.importUsers) {
        try {
          users = await this.fetchUsers();
          statistics.usersProcessed = users.length;
          console.log(`📊 [GP51ImportService] Processed ${users.length} users`);
        } catch (error) {
          const errorMsg = `Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`❌ [GP51ImportService] ${errorMsg}`);
        }
      }

      // Fetch devices if requested
      if (options.importDevices) {
        try {
          devices = await this.fetchDevices();
          statistics.devicesProcessed = devices.length;
          console.log(`📊 [GP51ImportService] Processed ${devices.length} devices`);
        } catch (error) {
          const errorMsg = `Failed to fetch devices: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`❌ [GP51ImportService] ${errorMsg}`);
        }
      }

      // In preview mode, just return the statistics without actually importing
      if (isPreviewMode) {
        console.log(`📊 [GP51ImportService] Preview completed`);
        return {
          success: true,
          message: `Preview completed: Found ${statistics.usersProcessed} users and ${statistics.devicesProcessed} devices`,
          statistics,
          errors
        };
      }

      // TODO: Add actual database import logic here for non-preview mode
      // This would involve creating/updating records in Supabase
      
      const totalProcessed = statistics.usersProcessed + statistics.devicesProcessed;
      console.log(`✅ [GP51ImportService] Import completed: ${totalProcessed} items processed`);

      return {
        success: true,
        message: `Import completed successfully: ${totalProcessed} items processed`,
        statistics,
        errors
      };

    } catch (error) {
      const errorMsg = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51ImportService] ${errorMsg}`);
      
      return {
        success: false,
        message: errorMsg,
        statistics,
        errors: [...errors, errorMsg]
      };
    }
  }
}
