
import { md5_sync } from './crypto_utils.ts';

export interface GP51AuthResult {
  success: boolean;
  username?: string;
  token?: string;
  expiresAt?: string;
  error?: string;
}

export interface GP51ApiResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class GP51StandardClient {
  private baseUrl: string = 'https://www.gps51.com/webapi';
  private authToken: string | null = null;
  private username: string | null = null;

  async authenticate(username: string, password: string): Promise<GP51AuthResult> {
    console.log(`🔐 [GP51Standard] Starting authentication for user: ${username}`);
    
    try {
      // Hash password using MD5 for GP51 compatibility
      const hashedPassword = md5_sync(password);
      
      const response = await this.makeRequest('login', {
        username: username.trim(),
        password: hashedPassword,
        from: 'WEB',      // Fixed: was 'logintype'
        type: 'USER'      // Fixed: was 'usertype'
      }, false); // No auth required for login

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Authentication failed'
        };
      }

      const data = response.data;
      
      // Store authentication details
      this.authToken = data.token;
      this.username = username.trim();
      
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      console.log(`🔐 [GP51Standard] Token stored, expires at: ${expiresAt}`);

      console.log(`✅ [GP51Standard] Authentication successful for ${username}`);
      
      return {
        success: true,
        username: this.username,
        token: this.authToken,
        expiresAt
      };

    } catch (error) {
      const errorMsg = `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51Standard] ${errorMsg}`);
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  async queryUserDetail(username: string): Promise<GP51ApiResult> {
    console.log(`👤 [GP51Standard] Querying user details for: ${username}`);
    
    return await this.makeRequest('queryuserdetail', {
      username: username.trim()
    }, true); // Requires authentication
  }

  async queryMonitorList(): Promise<GP51ApiResult> {
    console.log(`🚗 [GP51Standard] Querying monitor list (devices)`);
    
    return await this.makeRequest('querymonitorlist', {}, true); // Requires authentication
  }

  private async makeRequest(action: string, params: Record<string, any>, requiresAuth: boolean = true): Promise<GP51ApiResult> {
    try {
      // Construct URL with action parameter
      const url = new URL(this.baseUrl);
      url.searchParams.set('action', action);
      
      // Add auth token to URL if required and available
      if (requiresAuth) {
        if (!this.authToken) {
          return {
            success: false,
            error: 'Authentication token not available'
          };
        }
        url.searchParams.set('token', this.authToken);
        console.log(`📤 [GP51Standard] Action: ${action}, Auth: Required`);
      } else {
        console.log(`📤 [GP51Standard] Action: ${action}, Auth: Not Required`);
      }

      console.log(`📤 [GP51Standard] Making POST request to: ${url.toString()}`);

      // Log parameters (redact sensitive data)
      const logParams = { ...params };
      if (logParams.password) {
        logParams.password = '[REDACTED]';
      }
      console.log(`📤 [GP51Standard] Parameters:`, JSON.stringify(logParams, null, 2));

      // Make the request
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      console.log(`📊 [GP51Standard] Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`📊 [GP51Standard] Raw response: ${responseText}`);

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

      console.log(`📊 [GP51Standard] Parsed response:`, parsedResponse);

      // Check for GP51 API errors
      if (parsedResponse.status && parsedResponse.status !== 0) {
        const errorMsg = parsedResponse.cause || parsedResponse.message || `GP51 API error: ${parsedResponse.status}`;
        console.error(`❌ [GP51Standard] ${action} failed: ${errorMsg}`);
        
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
      console.error(`❌ [GP51Standard] ${errorMsg}`);
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }
}
