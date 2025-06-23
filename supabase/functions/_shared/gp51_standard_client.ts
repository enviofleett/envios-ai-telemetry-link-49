
// Enhanced GP51 Standard Client with proper authentication state management
import { md5_sync } from "./crypto_utils.ts";

export interface GP51StandardClientConfig {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface GP51AuthState {
  isAuthenticated: boolean;
  token?: string;
  username?: string;
  tokenExpiresAt?: Date;
  lastActivity?: Date;
}

export interface GP51ApiResponse<T = any> {
  status: number;
  cause?: string;
  token?: string;
  username?: string;
  data?: T;
  records?: T[];
  groups?: any[];
}

export class GP51StandardClient {
  private config: Required<GP51StandardClientConfig>;
  private authState: GP51AuthState;

  constructor(config: GP51StandardClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://www.gps51.com',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };

    this.authState = {
      isAuthenticated: false,
    };

    console.log(`🔧 [GP51StandardClient] Initialized with base URL: ${this.config.baseUrl}`);
  }

  private async makeRequest<T = any>(
    action: string,
    parameters: Record<string, any> = {},
    requiresAuth: boolean = false,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<GP51ApiResponse<T>> {
    // CRITICAL FIX: Build URL with token as query parameter for authenticated calls
    const url = new URL(`${this.config.baseUrl}/webapi`);
    url.searchParams.append('action', action);
    
    // Add token to URL query parameters for authenticated calls
    if (requiresAuth && this.authState.token) {
      url.searchParams.append('token', this.authState.token);
      console.log(`🔑 [GP51StandardClient] Added token to URL for ${action}`);
    }

    console.log(`📤 [GP51StandardClient] Making ${method} request to: ${url.toString()}`);
    
    const headers: HeadersInit = {
      'User-Agent': 'Envio-Fleet-Management/1.0',
    };

    let body: string | undefined;
    
    // CRITICAL FIX: Remove token from JSON body when it's in URL
    const bodyParams = { ...parameters };
    if (requiresAuth && this.authState.token && 'token' in bodyParams) {
      delete bodyParams.token;
      console.log(`🔧 [GP51StandardClient] Removed token from JSON body for ${action}`);
    }
    
    // Only add body for POST requests with parameters
    if (method === 'POST' && Object.keys(bodyParams).length > 0) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(bodyParams);
      console.log(`📤 [GP51StandardClient] Request body:`, JSON.stringify(bodyParams, null, 2));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

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
      console.log(`📊 [GP51StandardClient] Response received for ${action}, length: ${responseText.length}`);

      let result: GP51ApiResponse<T>;
      try {
        result = JSON.parse(responseText);
        console.log(`📋 [GP51StandardClient] Parsed response for ${action}:`, result);
      } catch (parseError) {
        console.error(`❌ [GP51StandardClient] JSON parse error for ${action}:`, parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
      }

      // Update last activity
      if (requiresAuth) {
        this.authState.lastActivity = new Date();
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ [GP51StandardClient] Request failed for ${action}:`, error);
      throw error;
    }
  }

  async authenticate(username: string, password: string): Promise<boolean> {
    console.log(`🔐 [GP51StandardClient] Authenticating user: ${username}`);
    
    try {
      const hashedPassword = md5_sync(password);
      console.log(`🔐 [GP51StandardClient] Password hashed successfully`);
      
      const loginParams = {
        username: username.trim(),
        password: hashedPassword,
        logintype: 'WEB',
        usertype: 'USER'
      };

      const result = await this.makeRequest('login', loginParams, false, 'POST');
      
      if (result.status === 0 && result.token) {
        // Store authentication state
        this.authState = {
          isAuthenticated: true,
          token: result.token,
          username: result.username || username,
          tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          lastActivity: new Date()
        };
        
        console.log(`✅ [GP51StandardClient] Authentication successful for ${username}`);
        console.log(`🔑 [GP51StandardClient] Token stored: ${result.token.substring(0, 8)}...`);
        return true;
      } else {
        const errorMsg = result.cause || `Login failed with status ${result.status}`;
        console.error(`❌ [GP51StandardClient] Authentication failed: ${errorMsg}`);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`❌ [GP51StandardClient] Authentication error:`, error);
      this.authState = { isAuthenticated: false };
      throw error;
    }
  }

  isAuthenticated(): boolean {
    if (!this.authState.isAuthenticated || !this.authState.token) {
      return false;
    }

    // Check token expiration
    if (this.authState.tokenExpiresAt && this.authState.tokenExpiresAt <= new Date()) {
      console.log(`⚠️ [GP51StandardClient] Token expired`);
      this.authState = { isAuthenticated: false };
      return false;
    }

    return true;
  }

  getAuthState(): GP51AuthState {
    return { ...this.authState };
  }

  clearAuth(): void {
    console.log(`🔓 [GP51StandardClient] Clearing authentication state`);
    this.authState = { isAuthenticated: false };
  }

  // API Methods
  async queryUserDetail(username: string): Promise<GP51ApiResponse> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please call authenticate() first.');
    }

    console.log(`👤 [GP51StandardClient] Querying user details for: ${username}`);
    
    const result = await this.makeRequest('queryuserdetail', { username }, true, 'POST');
    
    if (result.status === 0) {
      console.log(`✅ [GP51StandardClient] User details query successful`);
      return result;
    } else {
      const errorMsg = result.cause || `User details query failed with status ${result.status}`;
      console.error(`❌ [GP51StandardClient] User details query failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  async queryMonitorList(): Promise<GP51ApiResponse> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please call authenticate() first.');
    }

    console.log(`📡 [GP51StandardClient] Querying monitor list for user: ${this.authState.username}`);
    
    const result = await this.makeRequest('querymonitorlist', 
      { username: this.authState.username }, true, 'POST');
    
    if (result.status === 0) {
      console.log(`✅ [GP51StandardClient] Monitor list query successful, devices: ${result.records?.length || 0}`);
      return result;
    } else {
      const errorMsg = result.cause || `Monitor list query failed with status ${result.status}`;
      console.error(`❌ [GP51StandardClient] Monitor list query failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  async getLastPosition(deviceIds: string[], lastQueryPositionTime?: string): Promise<GP51ApiResponse> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please call authenticate() first.');
    }

    console.log(`📡 [GP51StandardClient] Getting last position for ${deviceIds.length} devices`);
    
    const positionParams = {
      deviceids: deviceIds,
      lastquerypositiontime: lastQueryPositionTime || ""
    };

    const result = await this.makeRequest('lastposition', positionParams, true, 'POST');
    
    if (result.status === 0) {
      console.log(`✅ [GP51StandardClient] Last position query successful, positions: ${result.records?.length || 0}`);
      return result;
    } else {
      const errorMsg = result.cause || `Last position query failed with status ${result.status}`;
      console.error(`❌ [GP51StandardClient] Get last position failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  async getDevicesWithPositions(): Promise<{ devices: any[], positions: any[] }> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please call authenticate() first.');
    }

    console.log(`🔄 [GP51StandardClient] Getting complete device and position data for user: ${this.authState.username}`);
    
    // Step 1: Get all devices
    const devicesResponse = await this.queryMonitorList();
    if (devicesResponse.status !== 0 || !devicesResponse.records) {
      throw new Error(`Failed to fetch devices: ${devicesResponse.cause}`);
    }

    const devices = devicesResponse.records;
    console.log(`📱 [GP51StandardClient] Found ${devices.length} devices`);

    if (devices.length === 0) {
      return { devices: [], positions: [] };
    }

    // Step 2: Get positions for all devices
    const deviceIds = devices.map(d => d.deviceid);
    const positionsResponse = await this.getLastPosition(deviceIds);
    
    const positions = positionsResponse.status === 0 && positionsResponse.records 
      ? positionsResponse.records 
      : [];

    console.log(`📍 [GP51StandardClient] Retrieved ${positions.length} positions`);

    return { devices, positions };
  }

  async callAction(action: string, parameters: Record<string, any>): Promise<GP51ApiResponse> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please call authenticate() first.');
    }

    console.log(`📡 [GP51StandardClient] Calling action: ${action}`);
    
    const result = await this.makeRequest(action, parameters, true, 'POST');
    
    if (result.status === 0) {
      console.log(`✅ [GP51StandardClient] Action ${action} successful`);
      return result;
    } else {
      const errorMsg = result.cause || `Action ${action} failed with status ${result.status}`;
      console.error(`❌ [GP51StandardClient] Action ${action} failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }
}
