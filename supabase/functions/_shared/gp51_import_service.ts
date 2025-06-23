
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

export class GP51ImportService {
  private supabaseUrl: string;
  private supabaseServiceKey: string;
  private gp51Token: string | null = null;
  private gp51BaseUrl: string;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseServiceKey = supabaseServiceKey;
    this.gp51BaseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
  }

  async authenticate(): Promise<void> {
    console.log('🔐 [GP51ImportService] Authenticating with GP51...');
    
    const username = Deno.env.get('GP51_ADMIN_USERNAME');
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!username || !password) {
      throw new Error('GP51 credentials not configured. Please set GP51_ADMIN_USERNAME and GP51_ADMIN_PASSWORD.');
    }

    try {
      // Hash password using MD5 for GP51 compatibility
      const hashedPassword = md5_sync(password);
      console.log('🔐 [GP51ImportService] Password hashed successfully');

      // Construct API URL
      const apiUrl = `${this.gp51BaseUrl}/webapi`;
      const loginUrl = new URL(apiUrl);
      loginUrl.searchParams.set('action', 'login');

      // Add global token if available
      const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
      if (globalToken) {
        loginUrl.searchParams.set('token', globalToken);
        console.log('🔑 [GP51ImportService] Using global API token');
      }

      // Prepare request body (JSON format)
      const requestBody = {
        username: username.trim(),
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      };

      console.log('📤 [GP51ImportService] Making authentication request to:', loginUrl.toString());
      console.log('📤 [GP51ImportService] Request body:', JSON.stringify({
        ...requestBody,
        password: '[REDACTED]'
      }));

      // Make authentication request
      const response = await fetch(loginUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'FleetIQ-ImportService/1.0'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000)
      });

      console.log('📊 [GP51ImportService] Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log('📊 [GP51ImportService] Raw response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('📊 [GP51ImportService] Parsed response:', JSON.stringify(result, null, 2));
      } catch (parseError) {
        // Handle plain text token response
        if (responseText.trim().length > 8 && !responseText.includes('error')) {
          result = { status: 0, token: responseText.trim() };
          console.log('📊 [GP51ImportService] Treating as plain text token');
        } else {
          throw new Error(`Invalid response format: ${responseText}`);
        }
      }

      // Check for successful authentication (status: 0 means success in GP51)
      if (result.status === 0 && result.token) {
        this.gp51Token = result.token;
        console.log('✅ [GP51ImportService] Authentication successful');
      } else {
        const errorMsg = result.cause || result.message || `Authentication failed with status ${result.status}`;
        console.error('❌ [GP51ImportService] Authentication failed:', errorMsg);
        throw new Error(`GP51 authentication failed: ${errorMsg}`);
      }

    } catch (error) {
      console.error('❌ [GP51ImportService] Authentication error:', error);
      throw new Error(`GP51 authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async performImport(options: ImportOptions): Promise<ImportResult> {
    console.log('🚀 [GP51ImportService] Starting import with options:', options);

    if (!this.gp51Token) {
      throw new Error('Not authenticated with GP51. Call authenticate() first.');
    }

    const statistics = {
      usersProcessed: 0,
      usersImported: 0,
      devicesProcessed: 0,
      devicesImported: 0,
      conflicts: 0
    };
    const errors: string[] = [];

    try {
      // For preview mode (skip conflict resolution), just return sample data
      if (options.conflictResolution === 'skip') {
        console.log('📊 [GP51ImportService] Running in preview mode');
        
        // Get device list for preview
        const devices = await this.fetchDeviceList();
        const users = await this.fetchUserList();

        statistics.devicesProcessed = devices.length;
        statistics.usersProcessed = users.length;

        console.log(`📊 [GP51ImportService] Preview completed: ${devices.length} devices, ${users.length} users`);

        return {
          success: true,
          message: `Preview completed successfully. Found ${devices.length} devices and ${users.length} users.`,
          statistics,
          errors
        };
      }

      // Actual import logic would go here
      // For now, return a placeholder implementation
      return {
        success: true,
        message: 'Import functionality not yet implemented',
        statistics,
        errors
      };

    } catch (error) {
      console.error('❌ [GP51ImportService] Import failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown import error');
      
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        statistics,
        errors
      };
    }
  }

  private async fetchDeviceList(): Promise<any[]> {
    if (!this.gp51Token) {
      throw new Error('Not authenticated');
    }

    try {
      const apiUrl = `${this.gp51BaseUrl}/webapi`;
      const devicesUrl = new URL(apiUrl);
      devicesUrl.searchParams.set('action', 'getmonitorlist');
      devicesUrl.searchParams.set('token', this.gp51Token);

      const response = await fetch(devicesUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FleetIQ-ImportService/1.0'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 [GP51ImportService] Device list response:', JSON.stringify(result, null, 2));

      if (result.status !== 0) {
        throw new Error(`GP51 device fetch failed: ${result.cause || 'Unknown error'}`);
      }

      const devices: any[] = [];
      if (result.groups && Array.isArray(result.groups)) {
        for (const group of result.groups) {
          if (group.devices && Array.isArray(group.devices)) {
            devices.push(...group.devices);
          }
        }
      }

      console.log(`📊 [GP51ImportService] Found ${devices.length} devices`);
      return devices;

    } catch (error) {
      console.error('❌ [GP51ImportService] Failed to fetch devices:', error);
      throw error;
    }
  }

  private async fetchUserList(): Promise<any[]> {
    // Placeholder - GP51 user fetching would be implemented here
    // For now, return empty array
    console.log('📊 [GP51ImportService] User fetching not yet implemented');
    return [];
  }
}
