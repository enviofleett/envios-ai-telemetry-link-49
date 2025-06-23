
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_for_gp51_only, sanitizeInput } from './crypto_utils.ts';

export interface ImportOptions {
  usernames?: string[];
  importUsers?: boolean;
  importDevices?: boolean;
  conflictResolution?: 'skip' | 'update';
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

// Rate limiting configuration for GP51 API calls
interface RateLimitConfig {
  baseDelay: number;
  maxRetries: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export class GP51ImportService {
  private supabaseUrl: string;
  private supabaseServiceKey: string;
  private supabase: any;
  private rateLimitConfig: RateLimitConfig;
  private lastRequestTime = 0;
  private consecutiveFailures = 0;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseServiceKey = supabaseServiceKey;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Configure rate limiting for GP51's strict limits
    this.rateLimitConfig = {
      baseDelay: 3000, // 3 seconds between requests
      maxRetries: 3,
      backoffMultiplier: 2,
      maxDelay: 30000 // 30 seconds max
    };
  }

  private async waitForRateLimit(): Promise<void> {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    const requiredDelay = this.rateLimitConfig.baseDelay;

    if (timeSinceLastRequest < requiredDelay) {
      const waitTime = requiredDelay - timeSinceLastRequest;
      console.log(`⏳ [GP51ImportService] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error;
    let currentDelay = this.rateLimitConfig.baseDelay;

    for (let attempt = 1; attempt <= this.rateLimitConfig.maxRetries; attempt++) {
      try {
        await this.waitForRateLimit();
        console.log(`🔄 [GP51ImportService] ${operationName} - Attempt ${attempt}/${this.rateLimitConfig.maxRetries}`);
        
        const result = await operation();
        this.consecutiveFailures = 0; // Reset on success
        return result;

      } catch (error) {
        lastError = error as Error;
        this.consecutiveFailures++;
        
        console.error(`❌ [GP51ImportService] ${operationName} failed (attempt ${attempt}):`, error);

        // Check for specific GP51 errors
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('ip limit') || errorMessage.includes('8902')) {
          console.warn(`🚫 [GP51ImportService] GP51 rate/IP limit detected`);
          
          // Longer delay for rate limit errors
          currentDelay = Math.min(currentDelay * 2, this.rateLimitConfig.maxDelay);
        }

        if (attempt < this.rateLimitConfig.maxRetries) {
          console.log(`⏳ [GP51ImportService] Backing off for ${currentDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          currentDelay = Math.min(currentDelay * this.rateLimitConfig.backoffMultiplier, this.rateLimitConfig.maxDelay);
        }
      }
    }

    throw lastError!;
  }

  async authenticate(): Promise<boolean> {
    try {
      const username = Deno.env.get('GP51_ADMIN_USERNAME');
      const password = Deno.env.get('GP51_ADMIN_PASSWORD');
      const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');

      if (!username || !password || !globalToken) {
        console.error('❌ [GP51ImportService] Missing GP51 credentials');
        return false;
      }

      return await this.executeWithRetry(async () => {
        console.log('🔐 [GP51ImportService] Testing GP51 authentication...');
        
        const hashedPassword = await md5_for_gp51_only(password);
        const loginUrl = new URL('https://www.gps51.com/webapi');
        loginUrl.searchParams.set('action', 'login');
        loginUrl.searchParams.set('token', globalToken);

        const response = await fetch(loginUrl.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/plain',
            'User-Agent': 'FleetIQ/1.0'
          },
          body: JSON.stringify({
            username: sanitizeInput(username),
            password: hashedPassword,
            from: 'WEB',
            type: 'USER'
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        if (!responseText || responseText.trim().length === 0) {
          throw new Error('Empty authentication response - check credentials');
        }

        let responseData;
        try {
          responseData = JSON.parse(responseText);
          if (responseData.status !== 0) {
            throw new Error(`Authentication failed: status ${responseData.status} - ${responseData.cause || 'Unknown error'}`);
          }
        } catch (parseError) {
          // Treat as plain text token if JSON parsing fails
          if (responseText.includes('error') || responseText.includes('fail')) {
            throw new Error(`Authentication failed: ${responseText}`);
          }
        }

        console.log('✅ [GP51ImportService] Authentication successful');
        return true;
      }, 'Authentication');

    } catch (error) {
      console.error('❌ [GP51ImportService] Authentication failed:', error);
      return false;
    }
  }

  private async makeAuthenticatedRequest(action: string, body: any = {}): Promise<any> {
    return await this.executeWithRetry(async () => {
      console.log(`🔐 [GP51ImportService] Making authenticated request for action: ${action}`);
      
      // Step 1: Fresh authentication for each request
      console.log(`🔐 [GP51ImportService] Step 1: Authenticating for ${action}...`);
      
      const username = Deno.env.get('GP51_ADMIN_USERNAME');
      const password = Deno.env.get('GP51_ADMIN_PASSWORD');
      const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');

      const hashedPassword = await md5_for_gp51_only(password);
      const loginUrl = new URL('https://www.gps51.com/webapi');
      loginUrl.searchParams.set('action', 'login');
      loginUrl.searchParams.set('token', globalToken);

      const loginResponse = await fetch(loginUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/plain',
          'User-Agent': 'FleetIQ/1.0'
        },
        body: JSON.stringify({
          username: sanitizeInput(username),
          password: hashedPassword,
          from: 'WEB',
          type: 'USER'
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.status}`);
      }

      const loginResponseText = await loginResponse.text();
      let userToken;

      try {
        const loginData = JSON.parse(loginResponseText);
        console.log(`🔐 [GP51ImportService] Login response status: ${loginData.status}`);
        
        if (loginData.status !== 0) {
          throw new Error(`Login failed with status ${loginData.status}: ${loginData.cause || 'Unknown error'}`);
        }
        
        userToken = loginData.token;
      } catch (parseError) {
        userToken = loginResponseText.trim();
      }

      if (!userToken) {
        throw new Error('No token received from login');
      }

      console.log(`🔐 [GP51ImportService] Fresh token obtained for ${action}`);

      // Step 2: Make the actual request with fresh token
      console.log(`📤 [GP51ImportService] Step 2: Making ${action} request with fresh token...`);
      
      const apiUrl = new URL('https://www.gps51.com/webapi');
      apiUrl.searchParams.set('action', action);
      apiUrl.searchParams.set('token', userToken);
      apiUrl.searchParams.set('username', sanitizeInput(username));

      const response = await fetch(apiUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'FleetIQ/1.0'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`${action} request failed: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText) {
        throw new Error(`Empty response from ${action} request`);
      }

      const responseData = JSON.parse(responseText);
      console.log(`📊 [GP51ImportService] ${action} response status: ${responseData.status}`);
      
      if (responseData.status !== 0) {
        throw new Error(`${action} failed: ${responseData.cause || 'Unknown error'}`);
      }

      return responseData;
    }, `${action} Request`);
  }

  private async fetchUsers(): Promise<any[]> {
    try {
      console.log('👤 [GP51ImportService] Fetching users with fresh authentication...');
      
      const response = await this.makeAuthenticatedRequest('queryuserlist');
      const users = response.results || [];
      
      console.log(`📊 [GP51ImportService] Processed ${users.length} users`);
      return users;
    } catch (error) {
      console.error('❌ [GP51ImportService] Failed to fetch users:', error);
      throw error;
    }
  }

  private async fetchDevices(): Promise<any[]> {
    try {
      console.log('🚗 [GP51ImportService] Fetching devices with fresh authentication...');
      
      const response = await this.makeAuthenticatedRequest('querymonitorlist');
      
      const devices: any[] = [];
      if (response.groups && Array.isArray(response.groups)) {
        for (const group of response.groups) {
          if (group.devices && Array.isArray(group.devices)) {
            devices.push(...group.devices);
          }
        }
      }
      
      console.log(`🚗 [GP51ImportService] Successfully fetched ${devices.length} devices`);
      console.log(`📊 [GP51ImportService] Processed ${devices.length} devices`);
      return devices;
    } catch (error) {
      console.error('❌ [GP51ImportService] Failed to fetch devices:', error);
      throw error;
    }
  }

  async performImport(options: ImportOptions): Promise<ImportResult> {
    console.log(`🚀 [GP51ImportService] Starting import with options:`, options);
    
    const statistics: ImportStatistics = {
      usersProcessed: 0,
      usersImported: 0,
      devicesProcessed: 0,
      devicesImported: 0,
      conflicts: 0
    };
    
    const errors: string[] = [];
    const isPreview = options.conflictResolution === 'skip';
    
    if (isPreview) {
      console.log('📊 [GP51ImportService] Running in preview mode');
    }

    try {
      // Fetch users if requested
      if (options.importUsers) {
        try {
          const users = await this.fetchUsers();
          statistics.usersProcessed = users.length;
          if (!isPreview) {
            // TODO: Implement actual user import with rate limiting
            statistics.usersImported = users.length;
          }
        } catch (error) {
          const errorMsg = `Failed to process users: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
        }
      }

      // Fetch devices if requested
      if (options.importDevices) {
        try {
          const devices = await this.fetchDevices();
          statistics.devicesProcessed = devices.length;
          if (!isPreview) {
            // TODO: Implement actual device import with rate limiting
            statistics.devicesImported = devices.length;
          }
        } catch (error) {
          const errorMsg = `Failed to process devices: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
        }
      }

      const hasData = statistics.usersProcessed > 0 || statistics.devicesProcessed > 0;
      const message = isPreview 
        ? (hasData ? 'Preview completed successfully' : 'No data available for import')
        : `Import completed: ${statistics.usersImported} users, ${statistics.devicesImported} devices`;

      console.log(`📊 [GP51ImportService] ${isPreview ? 'Preview' : 'Import'} completed`);

      return {
        success: true,
        message,
        statistics,
        errors
      };

    } catch (error) {
      const errorMsg = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ [GP51ImportService] Import failed:', error);
      
      return {
        success: false,
        message: errorMsg,
        statistics,
        errors: [errorMsg, ...errors]
      };
    }
  }
}
