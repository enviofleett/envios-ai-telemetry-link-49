
import { supabase } from '@/integrations/supabase/client';
import { 
  CreateDeviceRequest, 
  EditDeviceRequest, 
  CreateDeviceResponse, 
  QueryDeviceTypesResponse,
  GP51ApiResponse 
} from '@/types/gp51-device';

export class GP51DeviceManagementApi {
  private async callGP51Api(action: string, payload: any): Promise<any> {
    const { data, error } = await supabase.functions.invoke('gp51-device-management', {
      body: { action, ...payload }
    });

    if (error) {
      console.error('GP51 Device Management API error:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async addDevice(request: CreateDeviceRequest): Promise<CreateDeviceResponse> {
    console.log('Adding GP51 device:', request.deviceid);
    
    try {
      const response = await this.callGP51Api('adddevice', request);
      
      if (response.status === 0) {
        console.log('Device added successfully:', request.deviceid);
        
        // Sync device to local database
        await this.syncDeviceToLocal(request, response.device);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to add device:', error);
      throw error;
    }
  }

  async editDevice(request: EditDeviceRequest): Promise<GP51ApiResponse> {
    console.log('Editing GP51 device:', request.deviceid);
    
    try {
      const response = await this.callGP51Api('editdevicesimple', request);
      
      if (response.status === 0) {
        console.log('Device edited successfully:', request.deviceid);
        
        // Update local database
        await this.updateLocalDevice(request);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to edit device:', error);
      throw error;
    }
  }

  async deleteDevice(deviceid: string): Promise<GP51ApiResponse> {
    console.log('Deleting GP51 device:', deviceid);
    
    try {
      const response = await this.callGP51Api('deletedevice', { deviceid });
      
      if (response.status === 0) {
        console.log('Device deleted successfully:', deviceid);
        
        // Remove from local database
        await this.removeLocalDevice(deviceid);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to delete device:', error);
      throw error;
    }
  }

  async queryDeviceTypes(): Promise<QueryDeviceTypesResponse> {
    console.log('Querying GP51 device types');
    
    try {
      const response = await this.callGP51Api('querydevicetypeownerbyuser', {});
      
      if (response.status === 0) {
        console.log('Device types retrieved successfully');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to query device types:', error);
      throw error;
    }
  }

  private async syncDeviceToLocal(request: CreateDeviceRequest, deviceData?: any): Promise<void> {
    try {
      await supabase
        .from('vehicles')
        .upsert({
          device_id: request.deviceid,
          device_name: request.devicename,
          gp51_username: request.creater,
          status: request.deviceenable ? 'enabled' : 'disabled',
          is_active: request.deviceenable === 1,
          import_job_type: 'gp51_device_api',
          gp51_metadata: {
            devicetype: request.devicetype,
            groupid: request.groupid,
            loginenable: request.loginenable,
            timezone: request.timezone,
            calmileageway: request.calmileageway,
            ...deviceData
          }
        });
    } catch (error) {
      console.error('Failed to sync device to local database:', error);
    }
  }

  private async updateLocalDevice(request: EditDeviceRequest): Promise<void> {
    try {
      const updates: any = {
        device_name: request.devicename,
        updated_at: new Date().toISOString(),
        sim_number: request.simnum,
        notes: request.remark,
        gp51_metadata: {
          loginname: request.loginname,
          icon: request.icon,
          needloctype: request.needloctype
        }
      };
      
      await supabase
        .from('vehicles')
        .update(updates)
        .eq('device_id', request.deviceid);
    } catch (error) {
      console.error('Failed to update local device:', error);
    }
  }

  private async removeLocalDevice(deviceid: string): Promise<void> {
    try {
      await supabase
        .from('vehicles')
        .delete()
        .eq('device_id', deviceid);
    } catch (error) {
      console.error('Failed to remove local device:', error);
    }
  }

  getMileageCalculationLabel(mode: 0 | 1 | 2): string {
    const labels = {
      0: 'Auto',
      1: 'Device Collect',
      2: 'Platform Collect'
    };
    return labels[mode];
  }

  getLocationTypeLabel(type: 1 | 2 | 7): string {
    const labels = {
      1: 'GPS Only',
      2: 'LBS Only',
      7: 'GPS + LBS + Wifi'
    };
    return labels[type];
  }
}

export const gp51DeviceApi = new GP51DeviceManagementApi();
