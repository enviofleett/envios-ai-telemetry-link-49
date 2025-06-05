
import { supabase } from '@/integrations/supabase/client';
import { ChargeDevicesRequest, ChargeDevicesResponse } from '@/types/gp51-service';

export class GP51ServiceManagementApi {
  private async callGP51Api(action: string, payload: any): Promise<any> {
    const { data, error } = await supabase.functions.invoke('gp51-service-management', {
      body: { action, ...payload }
    });

    if (error) {
      console.error('GP51 Service Management API error:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async chargeDevices(request: ChargeDevicesRequest): Promise<ChargeDevicesResponse> {
    console.log('Charging GP51 devices:', request.deviceids);
    
    try {
      const response = await this.callGP51Api('chargedevices', request);
      
      if (response.status === 0) {
        console.log('Devices charged successfully:', request.deviceids);
        
        // Update service records in local database
        await this.updateServiceRecords(request);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to charge devices:', error);
      throw error;
    }
  }

  private async updateServiceRecords(request: ChargeDevicesRequest): Promise<void> {
    try {
      const serviceEndDate = new Date(request.overduetime);
      const serviceStartDate = new Date();
      serviceStartDate.setFullYear(serviceEndDate.getFullYear() - request.years);

      for (const deviceId of request.deviceids) {
        // Store service record
        await supabase
          .from('vehicles')
          .update({
            gp51_metadata: {
              service_end_date: request.overduetime,
              service_years: request.years,
              is_free: request.free === 1,
              last_charged: new Date().toISOString()
            }
          })
          .eq('device_id', deviceId.toString());
      }
    } catch (error) {
      console.error('Failed to update service records:', error);
    }
  }

  async getDevicesNearExpiration(daysThreshold: number = 30): Promise<any[]> {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
      
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .not('gp51_metadata->service_end_date', 'is', null);

      if (error) throw error;

      return vehicles?.filter(vehicle => {
        const metadata = vehicle.gp51_metadata as any;
        if (metadata?.service_end_date) {
          const serviceEndDate = new Date(metadata.service_end_date);
          return serviceEndDate <= thresholdDate;
        }
        return false;
      }) || [];
    } catch (error) {
      console.error('Failed to get devices near expiration:', error);
      return [];
    }
  }

  calculateServiceCost(deviceType: number, years: number): number {
    // This would be enhanced with actual pricing from device types
    const basePricePerYear = 120; // Base price in currency units
    return basePricePerYear * years;
  }
}

export const gp51ServiceApi = new GP51ServiceManagementApi();
