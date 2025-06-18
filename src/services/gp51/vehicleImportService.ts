
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GP51ImportResult {
  success: boolean;
  message: string;
  statistics: {
    totalDevicesProcessed: number;
    newDevicesAdded: number;
    devicesUpdated: number;
    positionsUpdated: number;
    errors: number;
  };
  syncType: 'fullSync' | 'batchedUpdate';
}

interface SyncData {
  type: 'fullSync' | 'batchedUpdate';
  devices?: any[];
  positions: any[];
  statistics: {
    totalDevices: number;
    totalPositions: number;
    batchesProcessed?: number;
    responseTime: number;
  };
  metadata: {
    fetchedAt: string;
    source: string;
    syncType: string;
  };
}

class VehicleImportService {
  private static instance: VehicleImportService;

  private constructor() {}

  static getInstance(): VehicleImportService {
    if (!VehicleImportService.instance) {
      VehicleImportService.instance = new VehicleImportService();
    }
    return VehicleImportService.instance;
  }

  async importFromGP51(forceFullSync: boolean = false): Promise<GP51ImportResult> {
    try {
      console.log(`🚀 Starting GP51 import - Force Full Sync: ${forceFullSync}`);
      
      // Call the enhanced edge function
      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: { forceFullSync }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Failed to fetch GP51 data: ${error.message}`);
      }

      if (!data.success) {
        console.error('❌ GP51 data fetch failed:', data.error);
        throw new Error(data.error || 'GP51 data fetch failed');
      }

      const syncData: SyncData = data.data;
      console.log(`📊 Processing ${syncData.type} with ${syncData.statistics.totalPositions} positions`);

      // Process the data based on sync type
      if (syncData.type === 'fullSync') {
        return await this.processFullSync(syncData);
      } else {
        return await this.processBatchedUpdate(syncData);
      }

    } catch (error) {
      console.error('❌ GP51 import failed:', error);
      throw error;
    }
  }

  private async processFullSync(syncData: SyncData): Promise<GP51ImportResult> {
    console.log('🔄 Processing Full Sync data...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const devices = syncData.devices || [];
      let newDevicesAdded = 0;
      let devicesUpdated = 0;
      let errors = 0;

      if (devices.length > 0) {
        // Prepare device data for upsert
        const vehicleData = devices.map(device => ({
          gp51_device_id: device.gp51_device_id,
          name: device.name,
          user_id: user.id,
          sim_number: device.sim_number,
          // Store position data if available
          last_position: device.last_position
        }));

        console.log(`📝 Upserting ${vehicleData.length} devices...`);

        // Perform batch upsert with conflict resolution
        const { data: upsertResult, error: upsertError } = await supabase
          .from('vehicles')
          .upsert(vehicleData, { 
            onConflict: 'gp51_device_id',
            ignoreDuplicates: false 
          })
          .select('gp51_device_id');

        if (upsertError) {
          console.error('❌ Upsert error:', upsertError);
          errors = vehicleData.length;
        } else {
          console.log(`✅ Successfully upserted ${upsertResult?.length || vehicleData.length} devices`);
          
          // For full sync, assume all are either new or updated
          // In practice, you might want to track this more precisely
          newDevicesAdded = vehicleData.length;
        }
      }

      return {
        success: true,
        message: `Full sync completed: ${newDevicesAdded} devices processed`,
        statistics: {
          totalDevicesProcessed: devices.length,
          newDevicesAdded,
          devicesUpdated,
          positionsUpdated: syncData.statistics.totalPositions,
          errors
        },
        syncType: 'fullSync'
      };

    } catch (error) {
      console.error('❌ Full sync processing failed:', error);
      throw error;
    }
  }

  private async processBatchedUpdate(syncData: SyncData): Promise<GP51ImportResult> {
    console.log('🔄 Processing Batched Update data...');
    
    try {
      const positions = syncData.positions;
      let devicesUpdated = 0;
      let positionsUpdated = 0;
      let errors = 0;

      if (positions.length > 0) {
        console.log(`📝 Updating positions for ${positions.length} records...`);

        // Process positions in chunks to avoid overwhelming the database
        const CHUNK_SIZE = 50;
        const chunks = [];
        for (let i = 0; i < positions.length; i += CHUNK_SIZE) {
          chunks.push(positions.slice(i, i + CHUNK_SIZE));
        }

        for (const [chunkIndex, chunk] of chunks.entries()) {
          console.log(`📦 Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} records)`);
          
          try {
            for (const position of chunk) {
              const deviceId = position.deviceid || position.imei || position.unit_id || position.device_id;
              
              if (!deviceId) {
                console.warn('⚠️ Skipping position record without device ID');
                continue;
              }

              // Update the vehicle's position data
              const updateData = {
                last_position: {
                  lat: position.callat || position.lat || position.latitude,
                  lon: position.callon || position.lng || position.longitude,
                  speed: position.speed,
                  course: position.course || position.heading,
                  updatetime: position.updatetime || position.timestamp,
                  statusText: position.strstatusen || position.status_text
                },
                updated_at: new Date().toISOString()
              };

              const { error: updateError } = await supabase
                .from('vehicles')
                .update(updateData)
                .eq('gp51_device_id', String(deviceId));

              if (updateError) {
                console.error(`❌ Failed to update vehicle ${deviceId}:`, updateError);
                errors++;
              } else {
                devicesUpdated++;
                positionsUpdated++;
              }
            }
          } catch (chunkError) {
            console.error(`❌ Error processing chunk ${chunkIndex + 1}:`, chunkError);
            errors += chunk.length;
          }
        }
      }

      return {
        success: true,
        message: `Batched update completed: ${devicesUpdated} devices updated`,
        statistics: {
          totalDevicesProcessed: syncData.statistics.totalDevices,
          newDevicesAdded: 0, // Batched updates don't add new devices
          devicesUpdated,
          positionsUpdated,
          errors
        },
        syncType: 'batchedUpdate'
      };

    } catch (error) {
      console.error('❌ Batched update processing failed:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async importVehiclesFromGP51(): Promise<GP51ImportResult> {
    return this.importFromGP51(false);
  }

  // Method to force a complete refresh
  async forceFullSyncFromGP51(): Promise<GP51ImportResult> {
    return this.importFromGP51(true);
  }
}

export const vehicleImportService = VehicleImportService.getInstance();
