
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
      const vehiclesResponse = await gp51DataService.queryMonitorList();
      
      if (!vehiclesResponse.success || !vehiclesResponse.data) {
        throw new Error('Failed to fetch vehicles from GP51');
      }

      const vehicles = vehiclesResponse.data;
      const deviceIds = vehicles.map(v => v.deviceId);

      // Get positions for all devices
      const positions = await gp51DataService.getPositions();

      let processed = 0;
      let errors = 0;

      // Process each position
      for (const position of positions) {
        try {
          // Ensure all numeric values are properly converted
          const latitude = Number(position.latitude);
          const longitude = Number(position.longitude);
          const speed = position.speed ? Number(position.speed) : 0;
          const course = position.course ? Number(position.course) : 0;

          // Validate that conversion worked
          if (isNaN(latitude) || isNaN(longitude)) {
            console.warn(`Invalid coordinates for device ${position.deviceId}: lat=${position.latitude}, lng=${position.longitude}`);
            errors++;
            continue;
          }

          // Convert position data to match Supabase schema
          const positionData = {
            device_id: position.deviceId,
            latitude: latitude,
            longitude: longitude,
            speed: speed,
            heading: course, // Map course to heading
            timestamp: new Date(typeof position.timestamp === 'string' ? position.timestamp : position.timestamp * 1000).toISOString(),
            created_at: new Date().toISOString()
          };

          // Store position in database using correct table structure
          const { error } = await supabase
            .from('vehicle_positions')
            .upsert(positionData, { onConflict: 'device_id' });

          if (error) {
            console.error(`Failed to sync position for device ${position.deviceId}:`, error);
            errors++;
          } else {
            processed++;
          }
        } catch (error) {
          console.error(`Error processing position for device ${position.deviceId}:`, error);
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

      const positions = await gp51DataService.getPositions();
      const position = positions.find(p => p.deviceId === deviceId);

      if (!position) {
        return {
          success: false,
          processed: 0,
          errors: 1,
          message: `No position data found for device ${deviceId}`
        };
      }

      // Ensure numeric conversion
      const latitude = Number(position.latitude);
      const longitude = Number(position.longitude);
      const speed = position.speed ? Number(position.speed) : 0;
      const course = position.course ? Number(position.course) : 0;

      // Validate coordinates
      if (isNaN(latitude) || isNaN(longitude)) {
        return {
          success: false,
          processed: 0,
          errors: 1,
          message: `Invalid coordinates for device ${deviceId}`
        };
      }

      // Convert position data to match Supabase schema
      const positionData = {
        device_id: deviceId,
        latitude: latitude,
        longitude: longitude,
        speed: speed,
        heading: course, // Map course to heading
        timestamp: new Date(typeof position.timestamp === 'string' ? position.timestamp : position.timestamp * 1000).toISOString(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('vehicle_positions')
        .upsert(positionData, { onConflict: 'device_id' });

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
