
import { supabase } from '@/integrations/supabase/client';
import { gp51DataService } from '@/services/gp51/GP51DataService';

interface SyncResult {
  success: boolean;
  processed: number;
  errors: number;
  message: string;
}

export class VehiclePositionSyncService {
  private static instance: VehiclePositionSyncService;
  private syncInProgress = false;

  private constructor() {}

  static getInstance(): VehiclePositionSyncService {
    if (!VehiclePositionSyncService.instance) {
      VehiclePositionSyncService.instance = new VehiclePositionSyncService();
    }
    return VehiclePositionSyncService.instance;
  }

  async syncAllVehiclePositions(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        processed: 0,
        errors: 1,
        message: 'Sync already in progress'
      };
    }

    this.syncInProgress = true;

    try {
      console.log('🔄 Starting vehicle position sync...');

      // Get vehicles from GP51
      const vehiclesResponse = await gp51DataService.getLiveVehicles();
      
      if (!vehiclesResponse.success || !vehiclesResponse.data) {
        throw new Error('Failed to fetch vehicles from GP51');
      }

      const vehicles = vehiclesResponse.data;
      const deviceIds = vehicles.map(v => v.deviceId);

      // Get positions for all devices
      const positions = await gp51DataService.getMultipleDevicesLastPositions(deviceIds);

      let processed = 0;
      let errors = 0;

      // Process each position
      for (const [deviceId, position] of positions.entries()) {
        try {
          // Store position in database
          const { error } = await supabase
            .from('vehicle_positions')
            .upsert({
              device_id: deviceId,
              latitude: position.latitude,
              longitude: position.longitude,
              speed: position.speed,
              course: position.course,
              status: position.status,
              is_moving: position.isMoving,
              timestamp: new Date(position.timestamp),
              updated_at: new Date()
            }, { onConflict: 'device_id' });

          if (error) {
            console.error(`Failed to sync position for device ${deviceId}:`, error);
            errors++;
          } else {
            processed++;
          }
        } catch (error) {
          console.error(`Error processing position for device ${deviceId}:`, error);
          errors++;
        }
      }

      const result = {
        success: errors === 0,
        processed,
        errors,
        message: `Processed ${processed} positions, ${errors} errors`
      };

      console.log('✅ Position sync completed:', result);
      return result;

    } catch (error) {
      console.error('❌ Position sync failed:', error);
      return {
        success: false,
        processed: 0,
        errors: 1,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncSingleVehiclePosition(deviceId: string): Promise<SyncResult> {
    try {
      console.log(`🔄 Syncing position for device ${deviceId}...`);

      const positions = await gp51DataService.getMultipleDevicesLastPositions([deviceId]);
      const position = positions.get(deviceId);

      if (!position) {
        return {
          success: false,
          processed: 0,
          errors: 1,
          message: `No position data found for device ${deviceId}`
        };
      }

      const { error } = await supabase
        .from('vehicle_positions')
        .upsert({
          device_id: deviceId,
          latitude: position.latitude,
          longitude: position.longitude,
          speed: position.speed,
          course: position.course,
          status: position.status,
          is_moving: position.isMoving,
          timestamp: new Date(position.timestamp),
          updated_at: new Date()
        }, { onConflict: 'device_id' });

      if (error) {
        return {
          success: false,
          processed: 0,
          errors: 1,
          message: error.message
        };
      }

      return {
        success: true,
        processed: 1,
        errors: 0,
        message: `Position synced for device ${deviceId}`
      };

    } catch (error) {
      return {
        success: false,
        processed: 0,
        errors: 1,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}

export const vehiclePositionSyncService = VehiclePositionSyncService.getInstance();
