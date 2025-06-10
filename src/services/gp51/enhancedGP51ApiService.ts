
import { supabase } from '@/integrations/supabase/client';
import { sanitizeJSON, validateGP51Position, validateVehicleData, validateBatch } from './dataValidation';
import { syncMutex, withSyncLock } from './syncMutex';

interface GP51ApiResponse {
  status: number;
  cause?: string;
  records?: any[];
  groups?: any[];
}

interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype?: number;
  simnum?: string;
  lastactivetime?: number;
}

export class EnhancedGP51ApiService {
  private static instance: EnhancedGP51ApiService;
  private baseUrl: string = 'https://www.gps51.com/webapi';
  private retryCount: number = 3;
  private retryDelay: number = 1000;

  static getInstance(): EnhancedGP51ApiService {
    if (!EnhancedGP51ApiService.instance) {
      EnhancedGP51ApiService.instance = new EnhancedGP51ApiService();
    }
    return EnhancedGP51ApiService.instance;
  }

  private async makeGP51Request(action: string, token: string, payload: any = {}): Promise<GP51ApiResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        console.log(`GP51 API Request (attempt ${attempt}/${this.retryCount}):`, { action, payload });
        
        const url = `${this.baseUrl}?action=${action}&token=${encodeURIComponent(token)}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`GP51 API Response (attempt ${attempt}):`, { status: data.status, cause: data.cause });
        
        if (data.status === -1) {
          throw new Error(`GP51 API Error: ${data.cause || 'global_unavailable_action'}`);
        }

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`GP51 API Request failed (attempt ${attempt}/${this.retryCount}):`, lastError.message);
        
        if (attempt < this.retryCount) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    throw lastError || new Error('GP51 API request failed after all retry attempts');
  }

  private async getValidToken(): Promise<string | null> {
    try {
      const { data: session, error } = await supabase
        .from('gp51_sessions')
        .select('gp51_token, token_expires_at')
        .eq('is_active', true)
        .single();

      if (error || !session) {
        console.error('No active GP51 session found:', error);
        return null;
      }

      // Check if token is expired
      if (new Date(session.token_expires_at) < new Date()) {
        console.error('GP51 token has expired');
        return null;
      }

      return session.gp51_token;
    } catch (error) {
      console.error('Error fetching GP51 token:', error);
      return null;
    }
  }

  async fetchDeviceList(): Promise<{ success: boolean; devices?: GP51Device[]; error?: string }> {
    return withSyncLock('gp51-device-list-sync', async () => {
      try {
        const token = await this.getValidToken();
        if (!token) {
          return { success: false, error: 'No valid GP51 token available' };
        }

        const response = await this.makeGP51Request('querymonitorlist', token, {});
        
        if (response.status === 0 && response.groups) {
          const devices: GP51Device[] = [];
          
          response.groups.forEach((group: any) => {
            if (group.devices && Array.isArray(group.devices)) {
              devices.push(...group.devices);
            }
          });
          
          console.log(`Successfully fetched ${devices.length} devices from GP51`);
          return { success: true, devices };
        }

        return { success: false, error: response.cause || 'No devices returned from GP51' };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Device list fetch failed:', errorMessage);
        return { success: false, error: errorMessage };
      }
    });
  }

  async fetchPositions(deviceIds: string[]): Promise<{ success: boolean; positions?: any[]; error?: string }> {
    return withSyncLock('gp51-position-sync', async () => {
      try {
        if (!deviceIds || deviceIds.length === 0) {
          return { success: false, error: 'No device IDs provided' };
        }

        const token = await this.getValidToken();
        if (!token) {
          return { success: false, error: 'No valid GP51 token available' };
        }

        const response = await this.makeGP51Request('lastposition', token, {
          deviceids: deviceIds,
          lastquerypositiontime: 0
        });

        if (response.status === 0 && response.records) {
          // Validate each position record
          const { valid: validPositions, invalid: invalidPositions } = validateBatch(
            response.records,
            validateGP51Position
          );

          if (invalidPositions.length > 0) {
            console.warn(`${invalidPositions.length} invalid position records detected:`, invalidPositions);
          }

          console.log(`Successfully fetched ${validPositions.length} valid positions from GP51`);
          return { success: true, positions: validPositions };
        }

        return { success: false, error: response.cause || 'No positions returned from GP51' };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Position fetch failed:', errorMessage);
        return { success: false, error: errorMessage };
      }
    });
  }

  async syncToDatabase(devices: GP51Device[], positions: any[]): Promise<{ success: boolean; stats?: any; error?: string }> {
    return withSyncLock('gp51-database-sync', async () => {
      try {
        const stats = {
          devicesProcessed: 0,
          devicesUpdated: 0,
          devicesFailed: 0,
          positionsProcessed: 0,
          positionsUpdated: 0,
          positionsFailed: 0,
          errors: [] as string[]
        };

        // Create position lookup map
        const positionMap = new Map();
        positions.forEach(pos => {
          if (pos.deviceid) {
            positionMap.set(String(pos.deviceid), pos);
          }
        });

        // Process devices with positions
        for (const device of devices) {
          stats.devicesProcessed++;
          
          try {
            const position = positionMap.get(String(device.deviceid));
            const vehicleData = {
              device_id: String(device.deviceid),
              device_name: device.devicename || `Device ${device.deviceid}`,
              last_position: position ? sanitizeJSON(position) : {},
              updated_at: new Date().toISOString(),
              is_active: true
            };

            const validation = validateVehicleData(vehicleData);
            if (!validation.valid) {
              stats.devicesFailed++;
              stats.errors.push(`Device ${device.deviceid}: ${validation.error}`);
              continue;
            }

            const { error } = await supabase
              .from('vehicles')
              .upsert(validation.data, { 
                onConflict: 'device_id',
                ignoreDuplicates: false 
              });

            if (error) {
              stats.devicesFailed++;
              stats.errors.push(`Database error for device ${device.deviceid}: ${error.message}`);
            } else {
              stats.devicesUpdated++;
              if (position) {
                stats.positionsUpdated++;
              }
            }
          } catch (error) {
            stats.devicesFailed++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            stats.errors.push(`Exception for device ${device.deviceid}: ${errorMessage}`);
          }
        }

        console.log('Database sync completed:', stats);
        return { success: true, stats };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Database sync failed:', errorMessage);
        return { success: false, error: errorMessage };
      }
    });
  }

  // Complete sync operation
  async performFullSync(): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      console.log('🔄 Starting enhanced GP51 full sync...');
      
      // Step 1: Fetch device list
      const deviceResult = await this.fetchDeviceList();
      if (!deviceResult.success || !deviceResult.devices) {
        return { success: false, error: `Device fetch failed: ${deviceResult.error}` };
      }

      if (deviceResult.devices.length === 0) {
        return { success: false, error: 'No devices found in GP51 account' };
      }

      // Step 2: Fetch positions for devices
      const deviceIds = deviceResult.devices.map(d => String(d.deviceid));
      const positionResult = await this.fetchPositions(deviceIds);
      
      // Continue even if positions fail - we still want to sync device list
      const positions = positionResult.success ? (positionResult.positions || []) : [];
      
      // Step 3: Sync to database
      const syncResult = await this.syncToDatabase(deviceResult.devices, positions);
      if (!syncResult.success) {
        return { success: false, error: `Database sync failed: ${syncResult.error}` };
      }

      const result = {
        devicesFound: deviceResult.devices.length,
        positionsFetched: positions.length,
        syncStats: syncResult.stats,
        timestamp: new Date().toISOString()
      };

      console.log('✅ Enhanced GP51 full sync completed successfully:', result);
      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Enhanced GP51 full sync failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Get sync status for debugging
  getSyncStatus(): any {
    return {
      activeLocks: syncMutex.getLockStatus(),
      timestamp: new Date().toISOString()
    };
  }
}

export const enhancedGP51ApiService = EnhancedGP51ApiService.getInstance();
