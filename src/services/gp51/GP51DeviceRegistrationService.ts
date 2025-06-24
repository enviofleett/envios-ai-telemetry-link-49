
import { supabase } from '@/integrations/supabase/client';

export interface GP51DeviceCreationData {
  deviceid: string;
  devicename: string;
  devicetype: number;
  groupid?: string;
  username?: string; // For assignment to specific GP51 user
}

export interface GP51DeviceCreationResult {
  success: boolean;
  gp51DeviceId?: string;
  devicename?: string;
  error?: string;
  errorCode?: string;
}

export class GP51DeviceRegistrationService {
  private static readonly DEFAULT_DEVICE_TYPE = 1; // Standard GPS tracker
  private static readonly DEFAULT_GROUP_ID = '0'; // Default group

  static async createGP51Device(deviceData: GP51DeviceCreationData): Promise<GP51DeviceCreationResult> {
    try {
      console.log('🔄 Creating GP51 device:', deviceData.deviceid);

      // Validate required fields
      if (!deviceData.deviceid || !deviceData.devicename) {
        return {
          success: false,
          error: 'Device ID and device name are required',
          errorCode: 'INVALID_INPUT'
        };
      }

      // Prepare GP51 device creation data
      const gp51DeviceData = {
        deviceid: deviceData.deviceid.trim(),
        devicename: deviceData.devicename.trim(),
        devicetype: deviceData.devicetype || this.DEFAULT_DEVICE_TYPE,
        groupid: deviceData.groupid || this.DEFAULT_GROUP_ID,
        username: deviceData.username || undefined
      };

      // Call the GP51 device registration edge function
      const { data, error } = await supabase.functions.invoke('gp51-device-registration', {
        body: {
          action: 'add_device',
          ...gp51DeviceData
        }
      });

      if (error) {
        console.error('❌ GP51 device registration edge function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to call GP51 device registration service',
          errorCode: 'EDGE_FUNCTION_ERROR'
        };
      }

      if (!data.success) {
        console.error('❌ GP51 device creation failed:', data.error);
        return {
          success: false,
          error: data.error || 'GP51 device creation failed',
          errorCode: data.errorCode || 'GP51_API_ERROR'
        };
      }

      console.log('✅ GP51 device created successfully:', data.gp51DeviceId);
      
      return {
        success: true,
        gp51DeviceId: data.gp51DeviceId || deviceData.deviceid,
        devicename: deviceData.devicename
      };

    } catch (error) {
      console.error('❌ GP51 device registration service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during GP51 device creation',
        errorCode: 'SERVICE_ERROR'
      };
    }
  }

  static async validateDeviceData(deviceData: GP51DeviceCreationData): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Device ID validation
    if (!deviceData.deviceid) {
      errors.push('Device ID is required');
    } else if (deviceData.deviceid.length < 3) {
      errors.push('Device ID must be at least 3 characters long');
    } else if (deviceData.deviceid.length > 50) {
      errors.push('Device ID must be less than 50 characters');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(deviceData.deviceid)) {
      errors.push('Device ID can only contain letters, numbers, underscores, and hyphens');
    }

    // Device name validation
    if (!deviceData.devicename) {
      errors.push('Device name is required');
    } else if (deviceData.devicename.length < 2) {
      errors.push('Device name must be at least 2 characters long');
    } else if (deviceData.devicename.length > 100) {
      errors.push('Device name must be less than 100 characters');
    }

    // Device type validation
    if (deviceData.devicetype !== undefined && ![1, 2, 3, 4, 5].includes(deviceData.devicetype)) {
      errors.push('Invalid device type. Must be between 1 and 5');
    }

    // Group ID validation (if provided)
    if (deviceData.groupid !== undefined && deviceData.groupid.length > 20) {
      errors.push('Group ID must be less than 20 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static async checkDeviceAvailability(deviceId: string): Promise<{ available: boolean; error?: string }> {
    try {
      console.log('🔍 Checking GP51 device availability:', deviceId);

      const { data, error } = await supabase.functions.invoke('gp51-device-registration', {
        body: {
          action: 'check_device',
          deviceid: deviceId.trim()
        }
      });

      if (error) {
        console.error('❌ Device availability check error:', error);
        return {
          available: false,
          error: 'Failed to check device availability'
        };
      }

      return {
        available: data.available || false
      };

    } catch (error) {
      console.error('❌ Device availability check service error:', error);
      return {
        available: false,
        error: 'Service error during device availability check'
      };
    }
  }
}
