
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
   * CORRECTED: Query monitor list using the proper GP51 API method
   */
  async queryDevicesTree(token: string, username?: string, password?: string): Promise<any> {
    console.log('🌳 [GP51-UNIFIED] Starting corrected queryDevicesTree (using querymonitorlist)');
    
    try {
      // We need fresh credentials since GP51 requires login for each session
      if (!username || !password) {
        throw new Error('Username and password required for GP51 authentication');
      }

      // Initialize client with credentials
      this.initializeClient(username, password);
      
      if (!this.unifiedClient) {
        throw new Error('Failed to initialize GP51 client');
      }

      // Use the corrected method that actually works with GP51
      const result = await this.unifiedClient.getDevicesHierarchy();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch devices hierarchy');
      }

      console.log('✅ [GP51-UNIFIED] Successfully retrieved devices tree');
      return result.data;

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

      this.initializeClient(username, password);
      
      if (!this.unifiedClient) {
        throw new Error('Failed to initialize GP51 client');
      }

      const result = await this.unifiedClient.getDevicesWithPositions();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch device positions');
      }

      return result.data.positions;

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

      this.initializeClient(username, password);
      
      if (!this.unifiedClient) {
        throw new Error('Failed to initialize GP51 client');
      }

      // Route to appropriate method based on action
      switch (action) {
        case 'querymonitorlist':
        case 'querydevicestree': // Alias for compatibility
          return await this.unifiedClient.getDevicesHierarchy();
          
        case 'lastposition':
          return await this.unifiedClient.getDevicesWithPositions();
          
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

      this.initializeClient(username, password);
      
      if (!this.unifiedClient) {
        return {
          success: false,
          error: 'Failed to initialize GP51 client',
          status: 500
        };
      }

      const result = await this.unifiedClient.getDevicesHierarchy();
      
      return {
        success: result.success,
        data: result.data,
        error: result.success ? undefined : result.message,
        status: result.success ? 200 : 400
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
