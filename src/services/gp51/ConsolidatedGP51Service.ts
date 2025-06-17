
import { secureGP51AuthService } from './SecureGP51AuthService';
import { supabase } from '@/integrations/supabase/client';
import { AuditLogger } from '@/services/auditLogging/AuditLogger';

export interface GP51Vehicle {
  deviceid: string;
  devicename: string;
  groupname?: string;
  status?: string;
}

export interface GP51Position {
  deviceid: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

/**
 * Consolidated GP51 Service - Single entry point for all GP51 operations
 * Replaces multiple scattered services with unified, secure approach
 */
export class ConsolidatedGP51Service {
  private static instance: ConsolidatedGP51Service;

  private constructor() {}

  static getInstance(): ConsolidatedGP51Service {
    if (!ConsolidatedGP51Service.instance) {
      ConsolidatedGP51Service.instance = new ConsolidatedGP51Service();
    }
    return ConsolidatedGP51Service.instance;
  }

  /**
   * Authenticate with GP51 using secure vault storage
   */
  async authenticate(username: string, password: string, apiUrl?: string) {
    return await secureGP51AuthService.authenticate(username, password, apiUrl);
  }

  /**
   * Get current authentication status
   */
  async getAuthStatus() {
    return await secureGP51AuthService.getAuthStatus();
  }

  /**
   * Fetch vehicle list from GP51
   */
  async fetchVehicles(): Promise<GP51Vehicle[]> {
    try {
      console.log('🚗 Fetching vehicles from GP51...');

      const authStatus = await secureGP51AuthService.getAuthStatus();
      if (!authStatus.isAuthenticated) {
        throw new Error('Not authenticated with GP51');
      }

      const { data, error } = await supabase.functions.invoke('gp51-consolidated-api', {
        body: { action: 'fetch_vehicles' }
      });

      if (error) {
        await this.logOperation('FETCH_VEHICLES', false, error.message);
        throw error;
      }

      if (!data.success) {
        await this.logOperation('FETCH_VEHICLES', false, data.error);
        throw new Error(data.error || 'Failed to fetch vehicles');
      }

      const vehicles = data.vehicles || [];
      console.log(`✅ Fetched ${vehicles.length} vehicles from GP51`);
      
      await this.logOperation('FETCH_VEHICLES', true, undefined, { count: vehicles.length });
      return vehicles;

    } catch (error) {
      console.error('❌ Vehicle fetch failed:', error);
      await this.logOperation('FETCH_VEHICLES', false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Fetch vehicle positions from GP51
   */
  async fetchPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      console.log(`📍 Fetching positions for ${deviceIds?.length || 'all'} vehicles...`);

      const authStatus = await secureGP51AuthService.getAuthStatus();
      if (!authStatus.isAuthenticated) {
        throw new Error('Not authenticated with GP51');
      }

      const { data, error } = await supabase.functions.invoke('gp51-consolidated-api', {
        body: { 
          action: 'fetch_positions',
          deviceIds: deviceIds || []
        }
      });

      if (error) {
        await this.logOperation('FETCH_POSITIONS', false, error.message);
        throw error;
      }

      if (!data.success) {
        await this.logOperation('FETCH_POSITIONS', false, data.error);
        throw new Error(data.error || 'Failed to fetch positions');
      }

      const positions = data.positions || [];
      console.log(`✅ Fetched ${positions.length} positions from GP51`);
      
      await this.logOperation('FETCH_POSITIONS', true, undefined, { count: positions.length });
      return positions;

    } catch (error) {
      console.error('❌ Position fetch failed:', error);
      await this.logOperation('FETCH_POSITIONS', false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Update vehicle positions in database
   */
  async updateVehiclePositions(positions: GP51Position[]): Promise<{ updated: number; errors: number }> {
    if (positions.length === 0) {
      return { updated: 0, errors: 0 };
    }

    try {
      console.log(`🔄 Updating ${positions.length} vehicle positions...`);

      const { data, error } = await supabase.functions.invoke('gp51-consolidated-api', {
        body: { 
          action: 'update_positions',
          positions
        }
      });

      if (error) {
        await this.logOperation('UPDATE_POSITIONS', false, error.message);
        return { updated: 0, errors: positions.length };
      }

      if (!data.success) {
        await this.logOperation('UPDATE_POSITIONS', false, data.error);
        return { updated: 0, errors: positions.length };
      }

      const result = { updated: data.updated || 0, errors: data.errors || 0 };
      console.log(`✅ Position update complete: ${result.updated} updated, ${result.errors} errors`);
      
      await this.logOperation('UPDATE_POSITIONS', true, undefined, result);
      return result;

    } catch (error) {
      console.error('❌ Position update failed:', error);
      await this.logOperation('UPDATE_POSITIONS', false, error instanceof Error ? error.message : 'Unknown error');
      return { updated: 0, errors: positions.length };
    }
  }

  /**
   * Logout from GP51
   */
  async logout() {
    return await secureGP51AuthService.logout();
  }

  /**
   * Test GP51 connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const credentials = await secureGP51AuthService.getSecureCredentials();
      if (!credentials) {
        return { success: false, error: 'No credentials found' };
      }

      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: {
          action: 'test_connection',
          username: credentials.username,
          password: credentials.password,
          apiUrl: credentials.apiUrl
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }

  /**
   * Log GP51 operations for audit trail
   */
  private async logOperation(
    operationType: string, 
    success: boolean, 
    errorMessage?: string, 
    details?: any
  ): Promise<void> {
    try {
      await AuditLogger.logSecurityEvent({
        actionType: 'api_access',
        resourceType: 'gp51',
        success,
        errorMessage,
        requestDetails: {
          operation: operationType,
          details,
          timestamp: new Date().toISOString()
        },
        riskLevel: success ? 'low' : 'medium'
      });
    } catch (error) {
      console.error('❌ Failed to log operation:', error);
    }
  }
}

export const consolidatedGP51Service = ConsolidatedGP51Service.getInstance();
