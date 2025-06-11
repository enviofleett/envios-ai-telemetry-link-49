import { supabase } from '@/integrations/supabase/client';

export interface GP51DeviceActivationRequest {
  deviceId: string;
  deviceName: string;
  deviceType: number;
  years?: number;
  adminUserId: string;
}

export interface GP51DeviceActivationResult {
  success: boolean;
  deviceId?: string;
  activationStatus?: 'active' | 'inactive' | 'error';
  error?: string;
  gp51Response?: any;
}

export class GP51DeviceActivationService {
  
  /**
   * Activate a device on GP51 and track it locally
   */
  static async activateDevice(request: GP51DeviceActivationRequest): Promise<GP51DeviceActivationResult> {
    try {
      console.log(`🔄 Activating GP51 device: ${request.deviceId}`);
      
      // Step 1: Charge/activate device on GP51
      const { data, error } = await supabase.functions.invoke('gp51-device-management', {
        body: {
          action: 'chargedevices',
          deviceids: request.deviceId,
          chargeyears: request.years || 1,
          devicetype: request.deviceType
        }
      });

      if (error) {
        console.error('❌ GP51 device activation failed:', error);
        return {
          success: false,
          error: error.message,
          activationStatus: 'error'
        };
      }

      if (!data.success) {
        console.error('❌ GP51 device activation returned error:', data);
        return {
          success: false,
          error: data.error || 'GP51 device activation failed',
          activationStatus: 'error'
        };
      }

      // Step 2: Update local tracking
      await this.updateDeviceActivationStatus(request.deviceId, 'active', data);

      console.log(`✅ GP51 device activated successfully: ${request.deviceId}`);
      return {
        success: true,
        deviceId: request.deviceId,
        activationStatus: 'active',
        gp51Response: data
      };

    } catch (error) {
      console.error('❌ GP51 device activation exception:', error);
      await this.updateDeviceActivationStatus(request.deviceId, 'error', { error: error.message });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        activationStatus: 'error'
      };
    }
  }

  /**
   * Check if a device is activated on GP51
   */
  static async checkDeviceActivationStatus(deviceId: string): Promise<{
    isActivated: boolean;
    status: 'active' | 'inactive' | 'error' | 'unknown';
    lastChecked?: string;
  }> {
    try {
      // Check local tracking first
      const { data: localStatus } = await supabase
        .from('gp51_device_management')
        .select('activation_status, last_sync_at')
        .eq('gp51_device_id', deviceId)
        .single();

      if (localStatus) {
        return {
          isActivated: localStatus.activation_status === 'active',
          status: localStatus.activation_status as 'active' | 'inactive' | 'error' | 'unknown',
          lastChecked: localStatus.last_sync_at
        };
      }

      // If no local record, query GP51 directly
      const { data, error } = await supabase.functions.invoke('gp51-device-management', {
        body: {
          action: 'queryalldevices'
        }
      });

      if (error || !data.success) {
        return {
          isActivated: false,
          status: 'error'
        };
      }

      const device = data.devices?.find((d: any) => d.deviceid === deviceId);
      const isActivated = device && device.isfree === 0; // isfree=0 means activated/paid

      return {
        isActivated,
        status: isActivated ? 'active' : 'inactive'
      };

    } catch (error) {
      console.error('❌ Error checking device activation status:', error);
      return {
        isActivated: false,
        status: 'error'
      };
    }
  }

  /**
   * Update local device activation tracking
   */
  private static async updateDeviceActivationStatus(
    deviceId: string, 
    status: 'active' | 'inactive' | 'error',
    gp51Response?: any
  ): Promise<void> {
    try {
      // Get vehicle ID from device ID
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('id')
        .eq('device_id', deviceId)
        .single();

      if (!vehicle) {
        console.warn(`⚠️ No vehicle found for device ${deviceId}`);
        return;
      }

      // Update or insert device management record
      await supabase
        .from('gp51_device_management')
        .upsert({
          vehicle_id: vehicle.id,
          gp51_device_id: deviceId,
          activation_status: status,
          last_sync_at: new Date().toISOString(),
          device_properties: gp51Response || {}
        }, {
          onConflict: 'vehicle_id,gp51_device_id'
        });

      // Update vehicle activation status
      await supabase
        .from('vehicles')
        .update({
          activation_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicle.id);

    } catch (error) {
      console.error('❌ Error updating device activation status:', error);
    }
  }

  /**
   * Bulk activate multiple devices
   */
  static async bulkActivateDevices(
    deviceIds: string[], 
    years: number = 1,
    adminUserId: string
  ): Promise<{
    successful: string[];
    failed: { deviceId: string; error: string }[];
  }> {
    const successful: string[] = [];
    const failed: { deviceId: string; error: string }[] = [];

    for (const deviceId of deviceIds) {
      try {
        const result = await this.activateDevice({
          deviceId,
          deviceName: deviceId,
          deviceType: 1, // Default device type
          years,
          adminUserId
        });

        if (result.success) {
          successful.push(deviceId);
        } else {
          failed.push({ deviceId, error: result.error || 'Unknown error' });
        }
      } catch (error) {
        failed.push({ 
          deviceId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return { successful, failed };
  }
}
