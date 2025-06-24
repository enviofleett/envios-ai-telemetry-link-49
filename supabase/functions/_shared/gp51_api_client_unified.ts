
import { buildGP51ApiUrl } from "./constants.ts";

export interface GP51ApiResponse {
  status: number;
  data?: any;
  cause?: string;
  message?: string;
  groups?: any[];
  records?: any[];
}

export class GP51ApiClientUnified {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'https://api.gps51.com', timeout: number = 15000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async queryDevicesTree(token: string, username?: string): Promise<GP51ApiResponse> {
    const startTime = Date.now();
    console.log(`🌳 [GP51-UNIFIED] Starting querydevicestree for user: ${username || 'unknown'}`);
    
    try {
      // Use the correct API endpoint with required parameters
      const url = buildGP51ApiUrl(this.baseUrl, 'querydevicestree', {
        token: token,
        extend: 'self',
        serverid: '0'
      });

      console.log(`📡 [GP51-UNIFIED] Request URL: ${url.replace(token, '[TOKEN_MASKED]')}`);
      console.log(`📡 [GP51-UNIFIED] Parameters: extend=self, serverid=0`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      const responseTime = Date.now() - startTime;
      console.log(`📊 [GP51-UNIFIED] Response received in ${responseTime}ms, status: ${response.status}`);

      if (!response.ok) {
        console.error(`❌ [GP51-UNIFIED] HTTP error: ${response.status} ${response.statusText}`);
        if (response.status === 401) {
          console.error(`🔑 [GP51-UNIFIED] Token authentication failed - token may be expired`);
          throw new Error(`Authentication failed: HTTP ${response.status}`);
        }
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`📥 [GP51-UNIFIED] Raw response (${responseText.length} chars): ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);

      let parsedResponse: GP51ApiResponse;
      try {
        parsedResponse = JSON.parse(responseText);
        console.log(`✅ [GP51-UNIFIED] Parsed JSON response successfully`);
      } catch (parseError) {
        console.error(`❌ [GP51-UNIFIED] JSON parse error:`, parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
      }

      // Validate GP51 API response structure
      if (typeof parsedResponse.status !== 'number') {
        console.error(`❌ [GP51-UNIFIED] Invalid response format - missing status field`);
        throw new Error(`Invalid GP51 response format`);
      }

      if (parsedResponse.status !== 0) {
        const errorMsg = parsedResponse.cause || parsedResponse.message || `GP51 API error: status ${parsedResponse.status}`;
        console.error(`❌ [GP51-UNIFIED] GP51 API error: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Log successful response details
      const deviceCount = parsedResponse.groups ? 
        parsedResponse.groups.reduce((sum: number, group: any) => sum + (group.devices?.length || 0), 0) : 0;
      
      console.log(`✅ [GP51-UNIFIED] querydevicestree successful:`);
      console.log(`  - Groups: ${parsedResponse.groups?.length || 0}`);
      console.log(`  - Total devices: ${deviceCount}`);
      console.log(`  - Response time: ${responseTime}ms`);

      return parsedResponse;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ [GP51-UNIFIED] querydevicestree failed after ${responseTime}ms:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      
      throw error;
    }
  }

  async queryMonitorList(token: string, username?: string): Promise<GP51ApiResponse> {
    console.log(`🔄 [GP51-UNIFIED] Redirecting queryMonitorList to queryDevicesTree for better data retrieval`);
    return this.queryDevicesTree(token, username);
  }

  async getLastPosition(token: string, deviceIds: string[], lastQueryTime?: string): Promise<GP51ApiResponse> {
    const startTime = Date.now();
    console.log(`📍 [GP51-UNIFIED] Getting last position for ${deviceIds.length} devices`);
    
    try {
      const url = buildGP51ApiUrl(this.baseUrl, 'lastposition', {
        token: token
      });

      const requestBody = {
        deviceids: deviceIds,
        lastquerypositiontime: lastQueryTime || ""
      };

      console.log(`📡 [GP51-UNIFIED] Position request URL: ${url.replace(token, '[TOKEN_MASKED]')}`);
      console.log(`📡 [GP51-UNIFIED] Position request body:`, requestBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout)
      });

      const responseTime = Date.now() - startTime;
      console.log(`📊 [GP51-UNIFIED] Position response in ${responseTime}ms, status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`Position authentication failed: HTTP ${response.status}`);
        }
        throw new Error(`HTTP error: ${response.status}`);
      }

      const responseText = await response.text();
      const parsedResponse = JSON.parse(responseText);

      if (parsedResponse.status !== 0) {
        const errorMsg = parsedResponse.cause || `Position API error: status ${parsedResponse.status}`;
        throw new Error(errorMsg);
      }

      console.log(`✅ [GP51-UNIFIED] Position data retrieved for ${parsedResponse.records?.length || 0} devices`);
      return parsedResponse;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ [GP51-UNIFIED] Position request failed after ${responseTime}ms:`, error);
      throw error;
    }
  }

  async callAction(action: string, parameters: Record<string, any>): Promise<GP51ApiResponse> {
    const startTime = Date.now();
    console.log(`🔧 [GP51-UNIFIED] Generic action call: ${action}`);
    
    try {
      const url = buildGP51ApiUrl(this.baseUrl, action, parameters);
      
      console.log(`📡 [GP51-UNIFIED] Generic request URL: ${url.replace(parameters.token || '', '[TOKEN_MASKED]')}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      const responseTime = Date.now() - startTime;
      console.log(`📊 [GP51-UNIFIED] Generic response in ${responseTime}ms, status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const responseText = await response.text();
      const parsedResponse = JSON.parse(responseText);

      if (parsedResponse.status !== 0) {
        const errorMsg = parsedResponse.cause || `${action} API error: status ${parsedResponse.status}`;
        throw new Error(errorMsg);
      }

      console.log(`✅ [GP51-UNIFIED] Generic action ${action} completed successfully`);
      return parsedResponse;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ [GP51-UNIFIED] Generic action ${action} failed after ${responseTime}ms:`, error);
      throw error;
    }
  }
}

export const gp51ApiClient = new GP51ApiClientUnified();
