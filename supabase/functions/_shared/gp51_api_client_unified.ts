
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
 * Unified GP51 API Client with proper URL structure
 */
export class GP51ApiClientUnified {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
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
   * Call any GP51 API action with proper URL structure
   */
  async callAction(action: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.token) {
      throw new Error('Not authenticated - call authenticate() first');
    }
    
    try {
      const urlParams: Record<string, string> = {
        token: this.token,
        ...Object.fromEntries(
          Object.entries(params).map(([key, value]) => [key, String(value)])
        )
      };
      
      const actionUrl = this.buildActionUrl(action, urlParams);
      
      console.log(`📡 Calling GP51 action: ${action}`);
      
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
      console.error(`❌ Action ${action} failed:`, error);
      throw error;
    }
  }

  /**
   * Query monitor list
   */
  async queryMonitorList(token: string, username?: string): Promise<any> {
    this.token = token;
    return this.callAction('getmonitorlist');
  }

  /**
   * Get last position
   */
  async getLastPosition(token: string, deviceIds: string[] = [], lastQueryTime?: string): Promise<any> {
    this.token = token;
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
   * Set token manually
   */
  setToken(token: string): void {
    this.token = token;
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
