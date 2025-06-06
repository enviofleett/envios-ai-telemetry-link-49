
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
      const vehicleData = {
        device_id: request.deviceId,
        device_name: request.deviceName,
        envio_user_id: request.assignedUserId || null,
        status: 'active',
        is_active: true,
        gp51_metadata: {
          device_type: request.deviceType,
          imei: request.imei || null,
          sim_number: request.simNumber || null,
          handshake_result: JSON.parse(JSON.stringify(productionData.handshakeResult)),
          communication_check: JSON.parse(JSON.stringify(productionData.communicationCheck)),
          configuration_id: productionData.configurationId || null,
          production_ready: true,
          created_by_admin: request.adminUserId,
          creation_timestamp: new Date().toISOString()
        },
        last_position: {
          status: productionData.handshakeResult.deviceStatus,
          updatetime: new Date().toISOString(),
          production_verified: true
        },
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
