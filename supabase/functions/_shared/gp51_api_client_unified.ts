import { getGP51ApiUrl } from "./constants.ts";
import { md5_for_gp51_only } from "./crypto_utils.ts";

export interface GP51ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

export interface GP51AuthCredentials {
  username: string;
  password: string;
  baseUrl?: string;
}

/**
 * Unified GP51 API Client with proper URL structure and corrected action names
 */
export class GP51ApiClientUnified {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
  }

  /**
   * Validates and cleans token format
   */
  private validateToken(token: string | any): string {
    if (!token) {
      throw new Error('Token is null or undefined');
    }

    // If token is an object (from database JSON), extract the actual token
    if (typeof token === 'object') {
      console.log('🔍 [GP51-API] Token is object, attempting to extract:', JSON.stringify(token));
      
      if (token.token) {
        const extractedToken = token.token;
        if (!extractedToken || extractedToken === null) {
          throw new Error('Token object contains null token value');
        }
        console.log('✅ [GP51-API] Extracted token from object');
        return String(extractedToken);
      } else {
        throw new Error('Token object does not contain token property');
      }
    }

    // If token is already a string, validate it
    const tokenString = String(token);
    if (tokenString.length < 10) {
      throw new Error('Token appears to be too short to be valid');
    }

    console.log('✅ [GP51-API] Token validated successfully');
    return tokenString;
  }

  /**
   * Builds a GP51 API URL with proper query parameters
   */
  private buildActionUrl(action: string, params: Record<string, string> = {}): string {
    const apiUrl = getGP51ApiUrl(this.baseUrl);
    const url = new URL(apiUrl);
    url.searchParams.set('action', action);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return url.toString();
  }

  /**
   * Authenticate with GP51 and store token
   */
  async authenticate(credentials: GP51AuthCredentials): Promise<GP51ApiResponse> {
    try {
      console.log('🔐 Authenticating with GP51 unified client...');
      
      const hashedPassword = await md5_for_gp51_only(credentials.password);
      const loginUrl = this.buildActionUrl('login');
      
      console.log(`📡 Login URL: ${loginUrl}`);
      
      const requestBody = {
        username: credentials.username.trim(),
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      };
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'GP51UnifiedClient/1.0'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Auth failed: ${response.status} ${errorText}`);
        return {
          success: false,
          error: `Authentication failed: ${response.status} - ${errorText}`,
          status: response.status
        };
      }
      
      const responseText = await response.text();
      
      if (!responseText || responseText.trim().length === 0) {
        return {
          success: false,
          error: 'Empty response from GP51 authentication'
        };
      }
      
      let authResult;
      try {
        authResult = JSON.parse(responseText);
      } catch (parseError) {
        // Handle plain text token response
        const token = responseText.trim();
        if (token && !token.includes('error') && !token.includes('fail')) {
          this.token = token;
          return { success: true, data: { token }, status: 200 };
        } else {
          return {
            success: false,
            error: `Invalid authentication response: ${token}`
          };
        }
      }
      
      if (authResult.status === 0 && authResult.token) {
        this.token = authResult.token;
        return { success: true, data: authResult, status: 200 };
      } else {
        return {
          success: false,
          error: authResult.cause || `Authentication failed with status ${authResult.status}`
        };
      }
      
    } catch (error) {
      console.error('❌ Authentication exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Call any GP51 API action with proper URL structure and token validation
   */
  async callAction(action: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.token) {
      throw new Error('Not authenticated - call authenticate() first');
    }
    
    try {
      // Validate token format before use
      const validatedToken = this.validateToken(this.token);
      
      const urlParams: Record<string, string> = {
        token: validatedToken,
        ...Object.fromEntries(
          Object.entries(params).map(([key, value]) => [key, String(value)])
        )
      };
      
      const actionUrl = this.buildActionUrl(action, urlParams);
      
      console.log(`📡 [GP51-API] Calling GP51 action: ${action} with validated token`);
      
      const response = await fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'GP51UnifiedClient/1.0'
        },
        signal: AbortSignal.timeout(30000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const responseText = await response.text();
      
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from GP51 API');
      }
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }
      
      if (result.status !== 0) {
        throw new Error(`GP51 API Error ${result.status}: ${result.cause}`);
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ [GP51-API] Action ${action} failed:`, error);
      throw error;
    }
  }

  /**
   * Query monitor list with corrected action name and multiple fallbacks
   */
  async queryMonitorList(token: string, username?: string): Promise<any> {
    // Validate and set token
    const validatedToken = this.validateToken(token);
    this.token = validatedToken;
    
    console.log('🔍 [GP51-API] Attempting to fetch monitor/device list...');
    
    // Try multiple possible action names for fetching device/monitor lists
    const possibleActions = [
      'querymonitorlist',    // Most likely correct action
      'getmonitorlist',      // Current incorrect action (keeping as fallback)
      'getdevicelist',       // Alternative device list action
      'querydevicelist',     // Alternative query format
      'listmonitors',        // Another possible format
      'listdevices'          // Another possible format
    ];
    
    let lastError: Error | null = null;
    
    for (const action of possibleActions) {
      try {
        console.log(`🔄 [GP51-API] Trying action: ${action}`);
        
        const params: Record<string, any> = {};
        if (username) {
          params.username = username;
        }
        
        const result = await this.callAction(action, params);
        
        console.log(`✅ [GP51-API] Successfully fetched data with action: ${action}`);
        return result;
        
      } catch (error) {
        console.log(`❌ [GP51-API] Action ${action} failed:`, error.message);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If this was a token/auth error, don't try other actions
        if (error.message.includes('token') || error.message.includes('auth')) {
          console.log('🚫 [GP51-API] Token/auth error detected, stopping action attempts');
          break;
        }
        
        // Continue to next action
        continue;
      }
    }
    
    // If all actions failed, throw the last error
    throw new Error(`All monitor list actions failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Get last position with corrected action and token validation
   */
  async getLastPosition(token: string, deviceIds: string[] = [], lastQueryTime?: string): Promise<any> {
    // Validate and set token
    const validatedToken = this.validateToken(token);
    this.token = validatedToken;
    
    console.log('🔍 [GP51-API] Fetching last position data...');
    
    const params: Record<string, any> = {};
    
    if (deviceIds.length > 0) {
      params.deviceids = deviceIds.join(',');
    }
    
    if (lastQueryTime) {
      params.lastquerypositiontime = lastQueryTime;
    }
    
    return this.callAction('lastposition', params);
  }

  /**
   * Set token manually with validation
   */
  setToken(token: string | any): void {
    try {
      const validatedToken = this.validateToken(token);
      this.token = validatedToken;
      console.log('✅ [GP51-API] Token set successfully');
    } catch (error) {
      console.error('❌ [GP51-API] Failed to set token:', error);
      throw new Error(`Invalid token format: ${error.message}`);
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }
}

// Export singleton instance
export const gp51ApiClient = new GP51ApiClientUnified();
