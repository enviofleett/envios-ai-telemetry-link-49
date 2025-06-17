
import { md5_sync } from "./crypto_utils.ts";
import { GP51_API_URL } from "./constants.ts";

export interface GP51ApiResponse {
  status: number;
  cause?: string;
  message?: string;
  token?: string;
  records?: any[];
  groups?: any[];
  devices?: any[];
  lastquerypositiontime?: number;
}

export interface GP51LoginRequest {
  action: 'login';
  username: string;
  password: string;
  from: string;
  type: string;
}

export interface GP51QueryRequest {
  action: string;
  token?: string;
  username?: string;
  deviceid?: string;
  deviceids?: string[];
  begintime?: string;
  endtime?: string;
  lastquerypositiontime?: string;
}

export class UnifiedGP51ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || GP51_API_URL;
  }

  /**
   * GP51 Login using the proven hybrid method (action in URL, credentials in body)
   */
  async login(username: string, password: string, from: string = 'WEB', type: string = 'USER'): Promise<GP51ApiResponse> {
    const hashedPassword = md5_sync(password);
    
    console.log(`🔐 [GP51Client] Attempting login for user: ${username}`);
    
    // Use the proven hybrid method: action in URL, credentials in JSON body
    const loginUrl = `${this.baseUrl}?action=login`;
    const requestBody = {
      username: username.trim(),
      password: hashedPassword,
      from: from,
      type: type
    };

    console.log(`📤 [GP51Client] Sending hybrid POST request to: ${loginUrl}`);
    console.log(`📤 [GP51Client] With body:`, { ...requestBody, password: '[REDACTED]' });

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [GP51Client] Login HTTP error: ${response.status}`);
      console.error(`❌ [GP51Client] Error response:`, errorText);
      throw new Error(`GP51 Login HTTP error: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log(`📊 [GP51Client] Login response received, length: ${responseText.length}`);

    let result: GP51ApiResponse;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`❌ [GP51Client] Failed to parse login response as JSON:`, parseError);
      console.log(`Raw response:`, responseText.substring(0, 500));
      throw new Error('Invalid JSON response from GP51 login endpoint');
    }

    console.log(`📋 [GP51Client] Parsed login response:`, result);

    if (result.status !== 0) {
      const errorMessage = result.cause || result.message || `Login failed (status: ${result.status})`;
      console.error(`❌ [GP51Client] Login failed:`, errorMessage);
      throw new Error(errorMessage);
    }

    if (!result.token) {
      console.error(`❌ [GP51Client] Login successful but no token received`);
      throw new Error('Login successful but no token received from GP51');
    }

    console.log(`✅ [GP51Client] Login successful for user: ${username}`);
    return result;
  }

  /**
   * Query Monitor List - Testing multiple request formats to resolve token issue
   */
  async queryMonitorList(token: string, username?: string): Promise<GP51ApiResponse> {
    console.log(`📡 [GP51Client] Querying monitor list with token`);
    console.log(`🔑 [GP51Client] Token (first 8 chars): ${token ? token.substring(0, 8) + '...' : 'MISSING'}`);
    console.log(`🔑 [GP51Client] Token length: ${token?.length || 0}`);
    console.log(`🔑 [GP51Client] Full token for debugging: ${token}`); // Temporary full token log for debugging
    
    // Try multiple request formats to identify the correct one
    const requestFormats = [
      {
        name: 'Format 1: Action in URL, Token in JSON body',
        url: `${this.baseUrl}?action=querymonitorlist`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0'
        },
        body: JSON.stringify({
          token: token,
          ...(username && { username })
        })
      },
      {
        name: 'Format 2: Token as URL parameter',
        url: `${this.baseUrl}?action=querymonitorlist&token=${encodeURIComponent(token)}${username ? `&username=${encodeURIComponent(username)}` : ''}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0'
        },
        body: JSON.stringify({})
      },
      {
        name: 'Format 3: GET request with token in URL',
        url: `${this.baseUrl}?action=querymonitorlist&token=${encodeURIComponent(token)}${username ? `&username=${encodeURIComponent(username)}` : ''}`,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0'
        },
        body: null
      },
      {
        name: 'Format 4: Form-encoded body',
        url: `${this.baseUrl}?action=querymonitorlist`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0'
        },
        body: new URLSearchParams({
          token: token,
          ...(username && { username })
        }).toString()
      }
    ];

    for (const format of requestFormats) {
      try {
        console.log(`🧪 [GP51Client] Trying ${format.name}`);
        console.log(`📤 [GP51Client] URL: ${format.url}`);
        console.log(`📤 [GP51Client] Method: ${format.method}`);
        console.log(`📤 [GP51Client] Headers:`, format.headers);
        if (format.body) {
          console.log(`📤 [GP51Client] Body: ${format.body}`);
        }

        const fetchOptions: RequestInit = {
          method: format.method,
          headers: format.headers,
          signal: AbortSignal.timeout(10000)
        };

        if (format.body) {
          fetchOptions.body = format.body;
        }

        const response = await fetch(format.url, fetchOptions);

        console.log(`📊 [GP51Client] Response status: ${response.status}`);
        console.log(`📊 [GP51Client] Response headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [GP51Client] ${format.name} HTTP error: ${response.status}`);
          console.error(`❌ [GP51Client] Error response:`, errorText);
          continue; // Try next format
        }

        const responseText = await response.text();
        console.log(`📊 [GP51Client] ${format.name} response received, length: ${responseText.length}`);
        console.log(`📊 [GP51Client] Raw response: ${responseText}`);

        let result: GP51ApiResponse;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`❌ [GP51Client] Failed to parse response as JSON for ${format.name}:`, parseError);
          console.log(`Raw response:`, responseText.substring(0, 500));
          continue; // Try next format
        }

        console.log(`📋 [GP51Client] Parsed response for ${format.name}:`, result);

        if (result.status === 0) {
          console.log(`✅ [GP51Client] ${format.name} successful!`);
          return result;
        } else {
          console.error(`❌ [GP51Client] ${format.name} failed with status ${result.status}: ${result.cause || result.message}`);
          // Continue to try other formats unless this is the last one
          if (format === requestFormats[requestFormats.length - 1]) {
            throw new Error(result.cause || result.message || `Query failed (status: ${result.status})`);
          }
        }
      } catch (error) {
        console.error(`❌ [GP51Client] ${format.name} threw error:`, error);
        // Continue to try other formats unless this is the last one
        if (format === requestFormats[requestFormats.length - 1]) {
          throw error;
        }
      }
    }

    // If we get here, all formats failed
    throw new Error('All request formats failed for queryMonitorList');
  }

  /**
   * Get Last Position using multiple request formats
   */
  async getLastPosition(token: string, deviceIds: string[], lastQueryTime?: string): Promise<GP51ApiResponse> {
    console.log(`📡 [GP51Client] Getting last position for ${deviceIds.length} devices`);
    console.log(`🔑 [GP51Client] Token (first 8 chars): ${token ? token.substring(0, 8) + '...' : 'MISSING'}`);
    
    // Use the same hybrid method that works for login - action in URL, data in JSON body
    const queryUrl = `${this.baseUrl}?action=lastposition`;
    const requestBody: any = {
      token: token,
      deviceids: deviceIds
    };

    if (lastQueryTime) {
      requestBody.lastquerypositiontime = lastQueryTime;
    }

    console.log(`📤 [GP51Client] Sending position request to: ${queryUrl}`);
    console.log(`📤 [GP51Client] With body:`, requestBody);

    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [GP51Client] Get last position HTTP error: ${response.status}`);
      console.error(`❌ [GP51Client] Error response:`, errorText);
      throw new Error(`GP51 Get last position HTTP error: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log(`📊 [GP51Client] Position response received, length: ${responseText.length}`);

    let result: GP51ApiResponse;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`❌ [GP51Client] Failed to parse position response as JSON:`, parseError);
      console.log(`Raw response:`, responseText.substring(0, 500));
      throw new Error('Invalid JSON response from GP51 position endpoint');
    }

    console.log(`📋 [GP51Client] Parsed position response:`, result);

    if (result.status !== 0) {
      const errorMessage = result.cause || result.message || `Get position failed (status: ${result.status})`;
      console.error(`❌ [GP51Client] Get last position failed:`, errorMessage);
      throw new Error(errorMessage);
    }

    console.log(`✅ [GP51Client] Get last position successful`);
    return result;
  }

  /**
   * Generic API call method for other GP51 actions
   */
  async callAction(action: string, parameters: Record<string, any>): Promise<GP51ApiResponse> {
    console.log(`📡 [GP51Client] Calling action: ${action}`);
    
    const queryUrl = `${this.baseUrl}?action=${action}`;

    console.log(`📤 [GP51Client] Sending ${action} request to: ${queryUrl}`);
    console.log(`📤 [GP51Client] With body:`, parameters);

    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      body: JSON.stringify(parameters),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [GP51Client] ${action} HTTP error: ${response.status}`);
      console.error(`❌ [GP51Client] Error response:`, errorText);
      throw new Error(`GP51 ${action} HTTP error: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log(`📊 [GP51Client] ${action} response received, length: ${responseText.length}`);

    let result: GP51ApiResponse;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`❌ [GP51Client] Failed to parse ${action} response as JSON:`, parseError);
      console.log(`Raw response:`, responseText.substring(0, 500));
      throw new Error(`Invalid JSON response from GP51 ${action} endpoint`);
    }

    console.log(`📋 [GP51Client] Parsed ${action} response:`, result);

    if (result.status !== 0) {
      const errorMessage = result.cause || result.message || `${action} failed (status: ${result.status})`;
      console.error(`❌ [GP51Client] ${action} failed:`, errorMessage);
      throw new Error(errorMessage);
    }

    console.log(`✅ [GP51Client] ${action} successful`);
    return result;
  }
}

// Export singleton instance
export const gp51ApiClient = new UnifiedGP51ApiClient();
