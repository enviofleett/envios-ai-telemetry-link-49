
import { supabase } from '@/integrations/supabase/client';
import { DeviceHandshakeResult } from '../gp51ProductionService';
import type { ProductionVehicleCreationRequest } from './deviceValidationService';

export class DatabaseOperationsService {
  /**
   * Creates vehicle in database with production metadata
   */
  static async createVehicleInDatabase(
    request: ProductionVehicleCreationRequest,
    productionData: {
      handshakeResult: DeviceHandshakeResult;
      communicationCheck: any;
      configurationId?: string;
    }
  ): Promise<{ success: boolean; vehicleId?: string; error?: string }> {
    try {
      // Map request data to correct database schema
      const vehicleData = {
        gp51_device_id: request.deviceId, // Use correct column name
        name: request.deviceName, // Use correct column name
        user_id: request.assignedUserId || null, // Use correct column name
        sim_number: request.simNumber || null, // Use correct column name
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select('id')
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        vehicleId: data.id
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database creation failed'
      };
    }
  }
}
