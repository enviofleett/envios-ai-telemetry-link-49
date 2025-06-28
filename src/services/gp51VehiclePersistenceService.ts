import { supabase } from '@/integrations/supabase/client';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51ProcessedPosition, GP51Position } from '@/types/gp51-unified';
import { GP51PropertyMapper } from '@/types/gp51-unified';

export class GP51VehiclePersistenceService {
  private positions: GP51Position[] = [];

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
        gp51_device_id: deviceId,
        name: position.deviceName || deviceId,
        user_id: user.id,
        sim_number: null,
      };

      const { error } = await supabase
        .from('vehicles')
        .upsert(vehicleData, { onConflict: 'gp51_device_id' });

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
        gp51_device_id: position.deviceId,
        name: position.deviceName || position.deviceId,
        user_id: user.id,
        sim_number: null,
      }));

      const { error } = await supabase
        .from('vehicles')
        .upsert(vehicleData, { onConflict: 'gp51_device_id' });

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

      const processedPosition = GP51PropertyMapper.mapPosition(position);
      processedPosition.deviceName = deviceId;

      await this.persistVehicleData(deviceId, processedPosition);
      console.log(`Data fetched and persisted successfully for device ${deviceId}`);
    } catch (error) {
      console.error(`Error fetching data and persisting for device ${deviceId}:`, error);
      throw error;
    }
  }

  async assignUserToVehicle(vehicleId: string, userId: string): Promise<void> {
    try {
      console.log(`Assigning user ${userId} to vehicle ${vehicleId}...`);

      const { error } = await supabase
        .from('vehicles')
        .update({ user_id: userId })
        .eq('id', vehicleId);

      if (error) {
        console.error(`Failed to assign user to vehicle:`, error);
        throw error;
      }

      console.log(`User assigned to vehicle successfully`);
    } catch (error) {
      console.error(`Error assigning user to vehicle:`, error);
      throw error;
    }
  }

  getPositionAtIndex(index: number): GP51Position | undefined {
    return this.positions && this.positions.length > index ? this.positions[index] : undefined;
  }

  getAllPositions(): GP51Position[] {
    return this.positions;
  }

  addPosition(position: GP51Position): void {
    this.positions.push(position);
  }

  clearPositions(): void {
    this.positions = [];
  }
}

export const gp51VehiclePersistenceService = new GP51VehiclePersistenceService();
