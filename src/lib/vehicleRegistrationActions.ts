
import { supabase } from '@/integrations/supabase/client';

export interface VehicleRegistrationData {
  deviceId: string;
  deviceName: string;
  userId: string;
  simNumber?: string;
  deviceType?: number;
  groupId?: string;
  enableGP51Integration?: boolean;
}

export interface VehicleRegistrationResult {
  success: boolean;
  vehicleId?: string;
  gp51DeviceId?: string;
  error?: string;
  errorCode?: string;
  gp51Result?: any;
}

export class VehicleRegistrationActions {
  static async registerVehicle(data: VehicleRegistrationData): Promise<VehicleRegistrationResult> {
    try {
      console.log('🚗 Starting vehicle registration:', data.deviceId);

      // Validate required fields
      if (!data.deviceId || !data.deviceName || !data.userId) {
        return {
          success: false,
          error: 'Device ID, device name, and user ID are required',
          errorCode: 'MISSING_REQUIRED_FIELDS'
        };
      }

      // Call the vehicle management edge function
      const { data: result, error } = await supabase.functions.invoke('vehicle-management', {
        body: {
          action: 'register_vehicle',
          deviceId: data.deviceId,
          deviceName: data.deviceName,
          deviceType: data.deviceType || 1,
          userId: data.userId,
          simNumber: data.simNumber,
          groupId: data.groupId || '0',
          enableGP51Integration: data.enableGP51Integration !== false // Default to true
        }
      });

      if (error) {
        console.error('❌ Vehicle registration edge function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to register vehicle',
          errorCode: 'EDGE_FUNCTION_ERROR'
        };
      }

      if (!result.success) {
        console.error('❌ Vehicle registration failed:', result.error);
        return {
          success: false,
          error: result.error || 'Vehicle registration failed',
          errorCode: result.errorCode || 'REGISTRATION_FAILED',
          gp51Result: result.gp51Result
        };
      }

      console.log('✅ Vehicle registered successfully:', result.vehicleId);

      return {
        success: true,
        vehicleId: result.vehicleId,
        gp51DeviceId: result.gp51DeviceId,
        gp51Result: result.gp51Result
      };

    } catch (error) {
      console.error('❌ Vehicle registration action error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during vehicle registration',
        errorCode: 'ACTION_ERROR'
      };
    }
  }
}
