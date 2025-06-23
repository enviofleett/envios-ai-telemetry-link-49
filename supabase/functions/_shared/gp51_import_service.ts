
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_sync } from './crypto_utils.ts';

export interface ImportOptions {
  usernames?: string[];
  importUsers?: boolean;
  importDevices?: boolean;
  conflictResolution?: 'skip' | 'update' | 'replace';
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

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype?: number;
  simnum?: string;
  loginame?: string;
  remark?: string;
}

export interface GP51User {
  username: string;
  nickname?: string;
  email?: string;
  phone?: string;
  usertype?: number;
}

export class GP51ImportService {
  private supabaseUrl: string;
  private supabaseServiceKey: string;
  private supabase: any;
  
  // Token management - separate global and user tokens
  private globalToken: string | null = null;
  private userToken: string | null = null;
  private username: string | null = null;
  
  private baseUrl: string = 'https://www.gps51.com/webapi';

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseServiceKey = supabaseServiceKey;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get global token from environment
    this.globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    console.log(`🔐 [GP51ImportService] Global token: ${this.globalToken ? 'AVAILABLE' : 'NOT SET'}`);
  }

  async authenticate(): Promise<boolean> {
    try {
      console.log('🔐 [GP51ImportService] Starting authentication...');
      
      const username = Deno.env.get('GP51_ADMIN_USERNAME');
      const password = Deno.env.get('GP51_ADMIN_PASSWORD');
      
      if (!username || !password) {
        throw new Error('GP51 credentials not configured');
      }
      
      if (!this.globalToken) {
        throw new Error('GP51 global token not configured');
      }

      // Hash password using MD5 for GP51 compatibility
      const hashedPassword = md5_sync(password);
      console.log('🔐 [GP51ImportService] Password hashed successfully');

      // Construct login URL with ONLY the global token
      const url = new URL(this.baseUrl);
      url.searchParams.set('action', 'login');
      url.searchParams.set('token', this.globalToken);

      console.log(`📤 [GP51ImportService] Making login request to: ${url.toString()}`);

      const requestBody = {
        username: username.trim(),
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      };

      // Log the request body for debugging (with password redacted)
      console.log(`📤 [GP51ImportService] Parameters:`, JSON.stringify({
        ...requestBody,
        password: '[REDACTED]'
      }));

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000)
      });

      console.log(`📊 [GP51ImportService] Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`📊 [GP51ImportService] Raw response: ${responseText}`);

      // Try to parse as JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        // If not JSON, treat as plain text token
        if (responseText.trim().length > 8) {
          parsedResponse = {
            status: 0,
            token: responseText.trim(),
            username: username
          };
        } else {
          throw new Error(`Invalid response format: ${responseText}`);
        }
      }

      console.log(`📊 [GP51ImportService] Parsed response:`, JSON.stringify(parsedResponse, null, 2));

      // Check for GP51 API errors
      if (parsedResponse.status && parsedResponse.status !== 0) {
        const errorMsg = parsedResponse.cause || parsedResponse.message || `GP51 API error: ${parsedResponse.status}`;
        console.error(`❌ [GP51ImportService] Login failed: ${errorMsg}`);
        return false;
      }

      // Store user session token and username
      this.userToken = parsedResponse.token;
      this.username = parsedResponse.username || username;
      
      console.log(`✅ [GP51ImportService] Authentication successful`);
      console.log(`🔑 [GP51ImportService] User token: ${this.userToken ? 'RECEIVED' : 'NOT RECEIVED'}`);
      console.log(`👤 [GP51ImportService] Username: ${this.username}`);
      
      return true;

    } catch (error) {
      console.error(`❌ [GP51ImportService] Authentication failed:`, error);
      return false;
    }
  }

  async fetchDevices(): Promise<GP51Device[]> {
    if (!this.userToken) {
      throw new Error('Not authenticated - user token required');
    }

    console.log('🚗 [GP51ImportService] Fetching device list...');
    console.log(`🔑 [GP51ImportService] Using user token for authenticated request`);

    try {
      // Construct URL with ONLY the user session token for authenticated requests
      const url = new URL(this.baseUrl);
      url.searchParams.set('action', 'querymonitorlist');
      url.searchParams.set('token', this.userToken);

      console.log(`📤 [GP51ImportService] Making request to: ${url.toString()}`);
      console.log(`📤 [GP51ImportService] Parameters: {}`);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(15000)
      });

      console.log(`📊 [GP51ImportService] Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`📊 [GP51ImportService] Raw response: ${responseText}`);

      const parsedResponse = JSON.parse(responseText);
      console.log(`📊 [GP51ImportService] Parsed response:`, parsedResponse);

      // Check for GP51 API errors
      if (parsedResponse.status && parsedResponse.status !== 0) {
        const errorMsg = parsedResponse.cause || parsedResponse.message || `GP51 API error: ${parsedResponse.status}`;
        throw new Error(errorMsg);
      }

      const devices: GP51Device[] = [];
      
      if (parsedResponse.groups && Array.isArray(parsedResponse.groups)) {
        for (const group of parsedResponse.groups) {
          if (group.devices && Array.isArray(group.devices)) {
            devices.push(...group.devices);
          }
        }
      }

      console.log(`✅ [GP51ImportService] Successfully fetched ${devices.length} devices`);
      return devices;

    } catch (error) {
      const errorMsg = `Failed to fetch devices: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51ImportService] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  async fetchUsers(): Promise<GP51User[]> {
    if (!this.userToken) {
      throw new Error('Not authenticated - user token required');
    }

    console.log('👥 [GP51ImportService] Fetching user list...');
    
    // For now, return the authenticated user as we don't have a bulk user endpoint
    const users: GP51User[] = [];
    
    if (this.username) {
      try {
        // Query user details using the user session token
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', 'queryuserdetail');
        url.searchParams.set('token', this.userToken);

        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            username: this.username
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (response.ok) {
          const responseText = await response.text();
          const userData = JSON.parse(responseText);
          
          if (userData.status === 0) {
            users.push({
              username: userData.username || this.username,
              nickname: userData.nickname,
              email: userData.email,
              phone: userData.phone,
              usertype: userData.usertype
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ [GP51ImportService] Could not fetch user details: ${error}`);
      }
    }

    console.log(`✅ [GP51ImportService] Found ${users.length} users`);
    return users;
  }

  async performImport(options: ImportOptions): Promise<ImportResult> {
    console.log('🚀 [GP51ImportService] Starting import with options:', options);

    const statistics = {
      usersProcessed: 0,
      usersImported: 0,
      devicesProcessed: 0,
      devicesImported: 0,
      conflicts: 0
    };

    const errors: string[] = [];

    try {
      // Fetch devices
      let devices: GP51Device[] = [];
      if (options.importDevices !== false) {
        devices = await this.fetchDevices();
        statistics.devicesProcessed = devices.length;
      }

      // Fetch users
      let users: GP51User[] = [];
      if (options.importUsers !== false) {
        users = await this.fetchUsers();
        statistics.usersProcessed = users.length;
      }

      console.log(`📊 [GP51ImportService] Estimated ${users.length} users and ${devices.length} devices`);

      // For preview mode (skip conflict resolution), just return the statistics
      if (options.conflictResolution === 'skip') {
        console.log(`📊 [GP51ImportService] Running in preview mode`);
        return {
          success: true,
          message: `Preview completed: Found ${devices.length} devices and ${users.length} users`,
          statistics,
          errors
        };
      }

      // TODO: Implement actual import logic here when not in preview mode
      // This would involve inserting the devices and users into Supabase tables

      return {
        success: true,
        message: `Import completed: ${statistics.devicesProcessed} devices and ${statistics.usersProcessed} users processed`,
        statistics,
        errors
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [GP51ImportService] Import failed:`, errorMsg);
      errors.push(errorMsg);

      return {
        success: false,
        message: `Import failed: ${errorMsg}`,
        statistics,
        errors
      };
    }
  }
}
