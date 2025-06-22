
// Unified GP51 API Client with proper token handling and correct parameter names
import { md5_sync } from "./crypto_utils.ts";

export interface GP51ApiResponse<T = any> {
  status: number;
  cause?: string;
  token?: string;
  username?: string;
  data?: T;
  records?: T[];
  groups?: any[];
  lastquerypositiontime?: number;
}

export class UnifiedGP51ApiClient {
  private baseUrl: string;
  private timeout: number;
  private globalToken?: string;

  constructor(baseUrl: string = 'https://www.gps51.com', timeout: number = 30000) {
    this.baseUrl = baseUrl.replace(/\/webapi\/?$/, '');
    this.timeout = timeout;
    this.globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
  }

  private async makeRequest<T = any>(
    action: string,
    sessionToken?: string,
    additionalParams?: Record<string, any>,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<GP51ApiResponse<T>> {
    // Build URL with action and tokens as query parameters
    const url = new URL(`${this.baseUrl}/webapi`);
    url.searchParams.append('action', action);
    
    // Add global token if available (for system-level operations)
    if (this.globalToken) {
      url.searchParams.append('token', this.globalToken);
    }
    
    // Add session token if provided (for user-specific operations)
    if (sessionToken) {
      url.searchParams.append('token', sessionToken);
    }

    console.log(`📤 [GP51Client] Making ${method} request to: ${url.toString()}`);
    
    const headers: HeadersInit = {
      'User-Agent': 'Envio-Fleet-Management/1.0',
      'Accept': 'application/json',
    };

    let body: string | undefined;
    
    // Add body for POST requests with additional parameters
    if (method === 'POST' && additionalParams && Object.keys(additionalParams).length > 0) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(additionalParams);
      console.log(`📤 [GP51Client] Request body:`, JSON.stringify(additionalParams, null, 2));
    }

    if (sessionToken) {
      console.log(`🔑 [GP51Client] Using session token: ${sessionToken.substring(0, 8)}...`);
    }
    if (this.globalToken) {
      console.log(`🌐 [GP51Client] Using global token: ${this.globalToken.substring(0, 8)}...`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📊 [GP51Client] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`📄 [GP51Client] Raw response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);

      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from GP51 API');
      }

      let result: GP51ApiResponse<T>;
      try {
        result = JSON.parse(responseText);
        console.log(`📋 [GP51Client] Parsed response:`, result);
      } catch (parseError) {
        // Handle plain text token response for login
        if (action === 'login' && responseText.trim() && !responseText.includes('error')) {
          result = {
            status: 0,
            token: responseText.trim()
          };
          console.log(`✅ [GP51Client] Login successful with plain text token: ${responseText.trim().substring(0, 8)}...`);
        } else {
          console.error(`❌ [GP51Client] JSON parse error:`, parseError);
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
        }
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`❌ [GP51Client] Request timeout after ${this.timeout}ms`);
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      console.error(`❌ [GP51Client] Request failed:`, error);
      throw error;
    }
  }

  async login(
    username: string,
    password: string,
    from: string = 'WEB',
    type: string = 'USER'
  ): Promise<GP51ApiResponse> {
    console.log(`🔐 [GP51Client] Attempting login for user: ${username}`);
    
    const hashedPassword = md5_sync(password);
    console.log(`🔐 [GP51Client] Password hashed: ${hashedPassword.substring(0, 8)}...`);
    
    // Use exact parameter names from GP51 API documentation
    const loginParams = {
      username: username.trim(),
      password: hashedPassword,
      from: from,  // Changed from 'logintype' to 'from'
      type: type   // Changed from 'usertype' to 'type'
    };

    const result = await this.makeRequest('login', undefined, loginParams, 'POST');
    
    if (result.status === 0 && result.token) {
      console.log(`✅ [GP51Client] Login successful for ${username}`);
      return result;
    } else {
      const errorMsg = result.cause || `Login failed with status ${result.status}`;
      console.error(`❌ [GP51Client] Login failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  async queryMonitorList(token: string, username?: string): Promise<GP51ApiResponse> {
    console.log(`📡 [GP51Client] Querying monitor list${username ? ` for user: ${username}` : ''}`);
    
    const params = username ? { username } : {};
    const result = await this.makeRequest('querymonitorlist', token, params, 'POST');
    
    if (result.status === 0) {
      console.log(`✅ [GP51Client] Monitor list query successful`);
      return result;
    } else {
      const errorMsg = result.cause || `Monitor list query failed with status ${result.status}`;
      console.error(`❌ [GP51Client] Monitor list query failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  async getLastPosition(
    token: string,
    deviceIds: string[],
    lastQueryPositionTime?: string
  ): Promise<GP51ApiResponse> {
    console.log(`📡 [GP51Client] Getting last position for ${deviceIds.length} devices`);
    
    const positionParams = {
      deviceids: deviceIds,
      lastquerypositiontime: lastQueryPositionTime || ""
    };

    const result = await this.makeRequest('lastposition', token, positionParams, 'POST');
    
    if (result.status === 0) {
      console.log(`✅ [GP51Client] Last position query successful`);
      return result;
    } else {
      const errorMsg = result.cause || `Last position query failed with status ${result.status}`;
      console.error(`❌ [GP51Client] Get last position failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  async logout(token: string): Promise<GP51ApiResponse> {
    console.log(`🔐 [GP51Client] Logging out session`);
    
    const result = await this.makeRequest('logout', token, {}, 'POST');
    
    if (result.status === 0) {
      console.log(`✅ [GP51Client] Logout successful`);
      return result;
    } else {
      const errorMsg = result.cause || `Logout failed with status ${result.status}`;
      console.error(`❌ [GP51Client] Logout failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  async callAction(action: string, parameters: Record<string, any>): Promise<GP51ApiResponse> {
    console.log(`📡 [GP51Client] Calling action: ${action}`);
    
    // Extract token from parameters if present
    const { token, ...otherParams } = parameters;
    
    const result = await this.makeRequest(action, token, otherParams, 'POST');
    
    if (result.status === 0) {
      console.log(`✅ [GP51Client] Action ${action} successful`);
      return result;
    } else {
      const errorMsg = result.cause || `Action ${action} failed with status ${result.status}`;
      console.error(`❌ [GP51Client] Action ${action} failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }
}

// Export singleton instance
export const gp51ApiClient = new UnifiedGP51ApiClient();
