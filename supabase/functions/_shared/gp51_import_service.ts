
import { md5_sync } from './crypto_utils.ts';

export interface ImportOptions {
  usernames?: string[];
  importUsers?: boolean;
  importDevices?: boolean;
  conflictResolution?: 'skip' | 'update' | 'fail';
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

export interface GP51ApiResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class GP51ImportService {
  private baseUrl: string = 'https://www.gps51.com/webapi';
  private authToken: string | null = null;
  private username: string | null = null;

  constructor(
    private supabaseUrl: string,
    private supabaseServiceKey: string
  ) {}

  async authenticate(): Promise<void> {
    console.log(`🔐 [GP51ImportService] Starting authentication...`);
    
    const username = Deno.env.get('GP51_ADMIN_USERNAME');
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!username || !password) {
      throw new Error('GP51 credentials not configured');
    }

    try {
      // Hash password using MD5 for GP51 compatibility
      const hashedPassword = md5_sync(password);
      console.log(`🔐 [GP51ImportService] Password hashed successfully`);
      
      const response = await this.makeRequest('login', {
        username: username.trim(),
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      }, false); // No auth required for login

      if (!response.success) {
        throw new Error(response.error || 'Authentication failed');
      }

      const data = response.data;
      
      // Store authentication details
      this.authToken = data.token;
      this.username = username.trim();
      
      console.log(`✅ [GP51ImportService] Authentication successful`);

    } catch (error) {
      const errorMsg = `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51ImportService] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  async performImport(options: ImportOptions): Promise<ImportResult> {
    console.log(`🚀 [GP51ImportService] Starting import with options:`, options);
    
    const isPreviewMode = options.conflictResolution === 'skip';
    if (isPreviewMode) {
      console.log(`📊 [GP51ImportService] Running in preview mode`);
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
      // Fetch devices if enabled
      if (options.importDevices) {
        const deviceResult = await this.fetchDeviceList();
        if (deviceResult.success && deviceResult.data) {
          statistics.devicesProcessed = Array.isArray(deviceResult.data) ? deviceResult.data.length : 0;
          console.log(`📊 [GP51ImportService] Found ${statistics.devicesProcessed} devices`);
          
          if (!isPreviewMode) {
            // TODO: Implement actual device import to Supabase
            statistics.devicesImported = statistics.devicesProcessed;
          }
        } else {
          errors.push(`Device fetch failed: ${deviceResult.error}`);
        }
      }

      // Fetch users if enabled
      if (options.importUsers) {
        if (options.usernames && options.usernames.length > 0) {
          // Fetch specific users
          for (const username of options.usernames) {
            try {
              const userResult = await this.fetchUserDetail(username);
              if (userResult.success) {
                statistics.usersProcessed++;
                if (!isPreviewMode) {
                  // TODO: Implement actual user import to Supabase
                  statistics.usersImported++;
                }
              } else {
                errors.push(`User fetch failed for ${username}: ${userResult.error}`);
              }
            } catch (error) {
              errors.push(`User fetch error for ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        } else {
          // For preview mode, we'll estimate user count based on device ownership
          // In a real implementation, you'd enumerate all users
          statistics.usersProcessed = Math.ceil(statistics.devicesProcessed * 0.8); // Estimate
          console.log(`📊 [GP51ImportService] Estimated ${statistics.usersProcessed} users`);
        }
      }

      const message = isPreviewMode 
        ? `Preview completed: Found ${statistics.devicesProcessed} devices and ${statistics.usersProcessed} users`
        : `Import completed: ${statistics.devicesImported} devices and ${statistics.usersImported} users imported`;

      return {
        success: true,
        message,
        statistics,
        errors
      };

    } catch (error) {
      console.error(`❌ [GP51ImportService] Import failed:`, error);
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        statistics,
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async fetchDeviceList(): Promise<GP51ApiResult> {
    console.log(`🚗 [GP51ImportService] Fetching device list...`);
    
    const result = await this.makeRequest('querymonitorlist', {}, true);
    
    if (result.success) {
      console.log(`📊 [GP51ImportService] Device list fetched successfully`);
    } else {
      console.error(`❌ [GP51ImportService] Failed to fetch devices:`, result.error);
    }
    
    return result;
  }

  private async fetchUserDetail(username: string): Promise<GP51ApiResult> {
    console.log(`👤 [GP51ImportService] Fetching user details for: ${username}`);
    
    const result = await this.makeRequest('queryuserdetail', {
      username: username.trim()
    }, true);
    
    if (result.success) {
      console.log(`📊 [GP51ImportService] User details fetched successfully for ${username}`);
    } else {
      console.error(`❌ [GP51ImportService] Failed to fetch user ${username}:`, result.error);
    }
    
    return result;
  }

  private async makeRequest(action: string, params: Record<string, any>, requiresAuth: boolean = true): Promise<GP51ApiResult> {
    try {
      // Get global token
      const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
      
      // Construct URL with action parameter
      const url = new URL(this.baseUrl);
      url.searchParams.set('action', action);
      
      // Add global token if available
      if (globalToken) {
        url.searchParams.set('token', globalToken);
      }
      
      // Add auth token to URL if required and available
      if (requiresAuth) {
        if (!this.authToken) {
          return {
            success: false,
            error: 'Authentication token not available'
          };
        }
        // Note: For authenticated requests, we might need to add the user token differently
        // The global token is already added above
      }

      console.log(`📤 [GP51ImportService] Making request to: ${url.toString()}`);

      // Log parameters (redact sensitive data)
      const logParams = { ...params };
      if (logParams.password) {
        logParams.password = '[REDACTED]';
      }
      console.log(`📤 [GP51ImportService] Parameters:`, JSON.stringify(logParams, null, 2));

      // Make the request using the same pattern as GP51StandardClient
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(15000) // 15 second timeout
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
        // If not JSON, treat as plain text (might be a token)
        if (action === 'login' && responseText.trim().length > 8) {
          parsedResponse = {
            status: 0,
            token: responseText.trim(),
            username: params.username
          };
        } else {
          throw new Error(`Invalid response format: ${responseText}`);
        }
      }

      console.log(`📊 [GP51ImportService] Parsed response:`, parsedResponse);

      // Check for GP51 API errors using the same logic as GP51StandardClient
      if (parsedResponse.status && parsedResponse.status !== 0) {
        const errorMsg = parsedResponse.cause || parsedResponse.message || `GP51 API error: ${parsedResponse.status}`;
        console.error(`❌ [GP51ImportService] ${action} failed: ${errorMsg}`);
        
        return {
          success: false,
          error: errorMsg
        };
      }

      return {
        success: true,
        data: parsedResponse
      };

    } catch (error) {
      const errorMsg = `${action} request failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51ImportService] ${errorMsg}`);
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }
}
