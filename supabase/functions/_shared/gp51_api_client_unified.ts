
import { md5_sync } from './crypto_utils.ts';

export interface GP51ApiResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

export class GP51ApiClient {
  private baseUrl: string = 'https://api.gps51.com/webapi';
  private timeout: number = 30000; // 30 seconds

  /**
   * Query devices tree using GET method (corrected for GP51 API)
   */
  async queryDevicesTree(token: string, username?: string): Promise<any> {
    console.log('🌳 [GP51-UNIFIED] Starting queryDevicesTree with GET method');
    
    try {
      // Build URL with query parameters - GP51 expects GET for querydevicestree
      const url = new URL(this.baseUrl);
      url.searchParams.set('action', 'querydevicestree');
      url.searchParams.set('token', token);
      url.searchParams.set('extend', 'self');
      url.searchParams.set('serverid', '0');

      console.log(`🌳 [GP51-UNIFIED] Making GET request to: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: 'GET', // Changed from POST to GET
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Envio-GP51-Client/1.0'
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      console.log(`🌳 [GP51-UNIFIED] Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`🌳 [GP51-UNIFIED] Raw response: ${responseText.substring(0, 200)}...`);

      // Try to parse as JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error('🌳 [GP51-UNIFIED] JSON parse error:', parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }

      // Check for GP51 API errors
      if (parsedResponse.status !== undefined && parsedResponse.status !== 0) {
        const errorMsg = parsedResponse.cause || parsedResponse.message || `GP51 API error: ${parsedResponse.status}`;
        console.error(`🌳 [GP51-UNIFIED] GP51 API error: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.log('🌳 [GP51-UNIFIED] Successfully retrieved devices tree');
      return parsedResponse;

    } catch (error) {
      const errorMsg = `queryDevicesTree failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51-UNIFIED] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  /**
   * Get last position data
   */
  async getLastPosition(token: string, deviceIds: string[] = [], lastQueryTime?: string): Promise<any> {
    console.log('📍 [GP51-UNIFIED] Starting getLastPosition');
    
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set('action', 'lastposition');
      url.searchParams.set('token', token);

      const payload: any = {};
      if (deviceIds.length > 0) {
        payload.deviceids = deviceIds;
      }
      if (lastQueryTime) {
        payload.lastquerypositiontime = lastQueryTime;
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status !== undefined && result.status !== 0) {
        throw new Error(result.cause || result.message || `GP51 API error: ${result.status}`);
      }

      return result;

    } catch (error) {
      const errorMsg = `getLastPosition failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51-UNIFIED] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  /**
   * Generic action caller for other GP51 actions
   */
  async callAction(action: string, parameters: Record<string, any>): Promise<any> {
    console.log(`🔄 [GP51-UNIFIED] Starting callAction: ${action}`);
    
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set('action', action);
      
      // Add parameters to URL for GET-style actions
      Object.entries(parameters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });

      console.log(`🔄 [GP51-UNIFIED] Making request to: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(parameters),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status !== undefined && result.status !== 0) {
        throw new Error(result.cause || result.message || `GP51 API error: ${result.status}`);
      }

      return result;

    } catch (error) {
      const errorMsg = `${action} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51-UNIFIED] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  /**
   * Test token validity with a simple API call
   */
  async testToken(token: string): Promise<GP51ApiResult> {
    console.log('🔍 [GP51-UNIFIED] Testing token validity');
    
    try {
      const result = await this.queryDevicesTree(token);
      return {
        success: true,
        data: result,
        status: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token test failed',
        status: 400
      };
    }
  }
}

// Export singleton instance
export const gp51ApiClient = new GP51ApiClient();
