import { supabase } from '@/integrations/supabase/client';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51ProcessedPosition } from '@/types/gp51';

export class GP51VehiclePersistenceService {
  private static instance: GP51VehiclePersistenceService;

  private constructor() {}

  static getInstance(): GP51VehiclePersistenceService {
    if (!GP51VehiclePersistenceService.instance) {
      GP51VehiclePersistenceService.instance = new GP51VehiclePersistenceService();
    }
    return GP51VehiclePersistenceService.instance;
  }

  async persistVehicleData(deviceId: string, position: GP51ProcessedPosition): Promise<void> {
    try {
      console.log(`Persisting vehicle data for device ${deviceId}...`);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const vehicleData = {
        device_id: deviceId,
        device_name: position.deviceName || deviceId,
        envio_user_id: user.id,
        is_active: true,
        gp51_metadata: {
          latitude: position.latitude,
          longitude: position.longitude,
          speed: position.speed,
          course: position.course,
          status: position.status,
          statusText: position.statusText,
          timestamp: position.timestamp.toISOString(),
          isMoving: position.isMoving,
          vehicleStatus: position.isOnline ? 'online' : 'offline',
          lastGP51Sync: new Date().toISOString(),
          importSource: 'gp51_live'
        }
      };

      const { error } = await supabase
        .from('vehicles')
        .upsert(vehicleData, { onConflict: 'device_id' });

      if (error) {
        console.error(`Failed to persist vehicle data for device ${deviceId}:`, error);
        throw error;
      }

      console.log(`Vehicle data persisted successfully for device ${deviceId}`);
    } catch (error) {
      console.error(`Error persisting vehicle data for device ${deviceId}:`, error);
      throw error;
    }
  }

  async batchPersistVehicleData(positions: GP51ProcessedPosition[]): Promise<void> {
    try {
      console.log(`Batch persisting vehicle data for ${positions.length} devices...`);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const vehicleData = positions.map(position => ({
        device_id: position.deviceId,
        device_name: position.deviceName || position.deviceId,
        envio_user_id: user.id,
        is_active: true,
        gp51_metadata: {
          latitude: position.latitude,
          longitude: position.longitude,
          speed: position.speed,
          course: position.course,
          status: position.status,
          statusText: position.statusText,
          timestamp: position.timestamp.toISOString(),
          isMoving: position.isMoving,
          vehicleStatus: position.isOnline ? 'online' : 'offline',
          lastGP51Sync: new Date().toISOString(),
          importSource: 'gp51_live'
        }
      }));

      const { error } = await supabase
        .from('vehicles')
        .upsert(vehicleData, { onConflict: 'device_id' });

      if (error) {
        console.error('Failed to batch persist vehicle data:', error);
        throw error;
      }

      console.log('Vehicle data batch persisted successfully');
    } catch (error) {
      console.error('Error batch persisting vehicle data:', error);
      throw error;
    }
  }

  async fetchDataAndPersist(deviceId: string): Promise<void> {
    try {
      console.log(`Fetching data and persisting for device ${deviceId}...`);
      const positions = await gp51DataService.getMultipleDevicesLastPositions([deviceId]);
      const position = positions.get(deviceId);

      if (!position) {
        throw new Error(`No position data found for device ${deviceId}`);
      }

      await this.persistVehicleData(deviceId, position);
      console.log(`Data fetched and persisted successfully for device ${deviceId}`);
    } catch (error) {
      console.error(`Error fetching data and persisting for device ${deviceId}:`, error);
      throw error;
    }
  }
}

export const gp51VehiclePersistenceService = GP51VehiclePersistenceService.getInstance();
