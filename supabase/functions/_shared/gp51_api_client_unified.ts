
import { GP51UnifiedClient } from './gp51_api_client_fixed.ts';

export interface GP51ApiResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

export class GP51ApiClient {
  private unifiedClient: GP51UnifiedClient | null = null;
  private timeout: number = 30000; // 30 seconds

  /**
   * Initialize with credentials for fresh authentication
   */
  private initializeClient(username: string, password: string): void {
    this.unifiedClient = new GP51UnifiedClient(username, password);
  }

  /**
   * ✅ CORRECTED: Query monitor list using the proper GP51 API method with GET and query parameters
   */
  async queryDevicesTree(token: string, username?: string, password?: string): Promise<any> {
    console.log('🌳 [GP51-UNIFIED] Starting corrected queryDevicesTree (using official API format)');
    
    try {
      // We need fresh credentials since GP51 requires login for each session
      if (!username || !password) {
        throw new Error('Username and password required for GP51 authentication');
      }

      // Hash password for GP51 API
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('MD5', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const gp51Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();

      // ✅ CORRECT: Using official GP51 API format with GET and query parameters
      const queryUrl = `https://www.gps51.com/webapi?action=querymonitorlist&username=${encodeURIComponent(username)}&password=${encodeURIComponent(gp51Hash)}`;
      
      console.log('🔄 [GP51-UNIFIED] Making querymonitorlist request (sanitized URL)');
      
      const result = await fetch(queryUrl, {
        method: 'GET',  // Official GP51 API uses GET
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FleetIQ/1.0'
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!result.ok) {
        throw new Error(`HTTP ${result.status}: ${result.statusText}`);
      }

      const data = await result.json();
      
      if (data.status !== 0) {
        throw new Error(data.cause || 'Failed to fetch devices hierarchy');
      }

      console.log('✅ [GP51-UNIFIED] Successfully retrieved devices tree');
      return data;

    } catch (error) {
      const errorMsg = `queryDevicesTree failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51-UNIFIED] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  /**
   * Get last position data using corrected implementation
   */
  async getLastPosition(token: string, deviceIds: string[] = [], lastQueryTime?: string, username?: string, password?: string): Promise<any> {
    console.log('📍 [GP51-UNIFIED] Starting getLastPosition with corrected client');
    
    try {
      if (!username || !password) {
        throw new Error('Username and password required for GP51 authentication');
      }

      // Hash password for GP51 API
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('MD5', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const gp51Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();

      // Build query parameters
      const params = new URLSearchParams({
        action: 'lastposition',
        username: username,
        password: gp51Hash
      });

      if (deviceIds.length > 0) {
        params.append('deviceids', deviceIds.join(','));
      }

      if (lastQueryTime) {
        params.append('lastquerypositiontime', lastQueryTime);
      }

      const positionUrl = `https://www.gps51.com/webapi?${params.toString()}`;
      
      const result = await fetch(positionUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FleetIQ/1.0'
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!result.ok) {
        throw new Error(`HTTP ${result.status}: ${result.statusText}`);
      }

      const data = await result.json();
      
      if (data.status !== 0) {
        throw new Error(data.cause || 'Failed to fetch device positions');
      }

      return data.positions || [];

    } catch (error) {
      const errorMsg = `getLastPosition failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51-UNIFIED] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  /**
   * Generic action caller - updated to use correct methods
   */
  async callAction(action: string, parameters: Record<string, any>): Promise<any> {
    console.log(`🔄 [GP51-UNIFIED] Starting callAction: ${action}`);
    
    try {
      const { username, password } = parameters;
      
      if (!username || !password) {
        throw new Error('Username and password required for GP51 authentication');
      }

      // Route to appropriate method based on action
      switch (action) {
        case 'querymonitorlist':
        case 'querydevicestree': // Alias for compatibility
          return await this.queryDevicesTree('', username, password);
          
        case 'lastposition':
          return await this.getLastPosition('', parameters.deviceids, parameters.lastquerypositiontime, username, password);
          
        default:
          throw new Error(`Unsupported action: ${action}`);
      }

    } catch (error) {
      const errorMsg = `${action} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [GP51-UNIFIED] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  /**
   * Test token validity with corrected implementation
   */
  async testToken(token: string, username?: string, password?: string): Promise<GP51ApiResult> {
    console.log('🔍 [GP51-UNIFIED] Testing connection with corrected client');
    
    try {
      if (!username || !password) {
        return {
          success: false,
          error: 'Username and password required for GP51 authentication',
          status: 400
        };
      }

      const result = await this.queryDevicesTree('', username, password);
      
      return {
        success: true,
        data: result,
        status: 200
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token test failed',
        status: 500
      };
    }
  }
}

// Export singleton instance
export const gp51ApiClient = new GP51ApiClient();
