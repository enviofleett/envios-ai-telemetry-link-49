
// Unified GP51 API Client with proper token handling and enhanced sync capabilities
import { md5_sync } from "./crypto_utils.ts";

export interface GP51ApiResponse<T = any> {
  status: number;
  cause?: string;
  token?: string;
  username?: string;
  data?: T;
  records?: T[];
  groups?: any[];
}

export interface GP51DeviceInfo {
  deviceid: string;
  devicename?: string;
  devicetype?: string;
  loginname?: string;
  groupid?: number;
  simnum?: string;
  lastactivetime?: string;
  expirenotifytime?: string;
  isfree?: boolean;
  allowedit?: boolean;
  icon?: string;
  starred?: boolean;
  totaldistance?: number;
  totaloil?: number;
  // Position data
  callat?: number;
  callon?: number;
  altitude?: number;
  speed?: number;
  course?: number;
  devicetime?: string;
  arrivedtime?: string;
  validpositiontime?: string;
  updatetime?: string;
  status?: number;
  strstatus?: string;
  strstatusen?: string;
  alarm?: string;
}

export class UnifiedGP51ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'https://www.gps51.com', timeout: number = 30000) {
    this.baseUrl = baseUrl.replace(/\/webapi\/?$/, '');
    this.timeout = timeout;
  }

  private async makeRequest<T = any>(
    action: string,
    token?: string,
    additionalParams?: Record<string, any>,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<GP51ApiResponse<T>> {
    // Build URL with action and token as query parameters
    const url = new URL(`${this.baseUrl}/webapi`);
    url.searchParams.append('action', action);
    
    if (token) {
      url.searchParams.append('token', token);
    }

    console.log(`📤 [GP51Client] Making ${method} request to: ${url.toString()}`);
    
    const headers: HeadersInit = {
      'User-Agent': 'Envio-Fleet-Management/1.0',
    };

    let body: string | undefined;
    
    // Only add body for POST requests with additional parameters
    if (method === 'POST' && additionalParams && Object.keys(additionalParams).length > 0) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(additionalParams);
      console.log(`📤 [GP51Client] With body:`, JSON.stringify(additionalParams, null, 2));
    }

    if (token) {
      console.log(`🔑 [GP51Client] Token (first 8 chars): ${token.substring(0, 8)}...`);
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

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`📊 [GP51Client] Response received, length: ${responseText.length}`);

      let result: GP51ApiResponse<T>;
      try {
        result = JSON.parse(responseText);
        console.log(`📋 [GP51Client] Parsed response:`, result);
      } catch (parseError) {
        console.error(`❌ [GP51Client] JSON parse error:`, parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ [GP51Client] Request failed:`, error);
      throw error;
    }
  }

  async login(
    username: string,
    password: string,
    loginType: string = 'WEB',
    userType: string = 'USER'
  ): Promise<GP51ApiResponse> {
    console.log(`🔐 [GP51Client] Attempting login for user: ${username}`);
    
    const hashedPassword = md5_sync(password);
    
    const loginParams = {
      username: username.trim(),
      password: hashedPassword,
      logintype: loginType,
      usertype: userType
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

  async queryMonitorList(token: string, username: string): Promise<GP51ApiResponse<GP51DeviceInfo>> {
    console.log(`📡 [GP51Client] Querying monitor list for user: ${username}`);
    
    const result = await this.makeRequest<GP51DeviceInfo>('querymonitorlist', token, { username }, 'POST');
    
    if (result.status === 0) {
      console.log(`✅ [GP51Client] Monitor list query successful, devices: ${result.records?.length || 0}`);
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
  ): Promise<GP51ApiResponse<GP51DeviceInfo>> {
    console.log(`📡 [GP51Client] Getting last position for ${deviceIds.length} devices`);
    
    const positionParams = {
      deviceids: deviceIds,
      lastquerypositiontime: lastQueryPositionTime || ""
    };

    const result = await this.makeRequest<GP51DeviceInfo>('lastposition', token, positionParams, 'POST');
    
    if (result.status === 0) {
      console.log(`✅ [GP51Client] Last position query successful, positions: ${result.records?.length || 0}`);
      return result;
    } else {
      const errorMsg = result.cause || `Last position query failed with status ${result.status}`;
      console.error(`❌ [GP51Client] Get last position failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  async getDevicesWithPositions(
    token: string,
    username: string
  ): Promise<{ devices: GP51DeviceInfo[], positions: GP51DeviceInfo[] }> {
    console.log(`🔄 [GP51Client] Getting complete device and position data for user: ${username}`);
    
    // Step 1: Get all devices
    const devicesResponse = await this.queryMonitorList(token, username);
    if (devicesResponse.status !== 0 || !devicesResponse.records) {
      throw new Error(`Failed to fetch devices: ${devicesResponse.cause}`);
    }

    const devices = devicesResponse.records;
    console.log(`📱 [GP51Client] Found ${devices.length} devices`);

    if (devices.length === 0) {
      return { devices: [], positions: [] };
    }

    // Step 2: Get positions for all devices
    const deviceIds = devices.map(d => d.deviceid);
    const positionsResponse = await this.getLastPosition(token, deviceIds);
    
    const positions = positionsResponse.status === 0 && positionsResponse.records 
      ? positionsResponse.records 
      : [];

    console.log(`📍 [GP51Client] Retrieved ${positions.length} positions`);

    return { devices, positions };
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
