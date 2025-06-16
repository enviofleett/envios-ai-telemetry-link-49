
import { supabase } from '@/integrations/supabase/client';
import type { DeviceHandshakeResult } from '../gp51ProductionService';

export interface ProductionVehicleCreationRequest {
  deviceId: string;
  deviceName: string;
  deviceType: number;
  imei?: string;
  simNumber?: string;
  assignedUserId?: string;
  adminUserId: string;
  performHealthCheck?: boolean;
  enableMonitoring?: boolean;
}

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
        gp51_device_id: request.deviceId,
        name: request.deviceName,
        user_id: request.assignedUserId || null,
        sim_number: request.simNumber || null,
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
