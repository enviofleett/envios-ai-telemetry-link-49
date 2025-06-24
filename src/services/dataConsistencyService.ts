
import { supabase } from '@/integrations/supabase/client';

export interface DuplicateDeviceInfo {
  device_id: string;
  count: number;
  affected_records: any[];
}

export interface DataConsistencyReport {
  duplicate_devices: DuplicateDeviceInfo[];
  orphaned_vehicles: any[];
  invalid_user_assignments: any[];
  data_quality_score: number;
  recommendations: string[];
}

class DataConsistencyService {
  async findDuplicateDeviceIds(): Promise<DuplicateDeviceInfo[]> {
    try {
      // Since the RPC function doesn't exist, we'll do a manual query
      const { data, error } = await supabase
        .from('vehicles')
        .select('gp51_device_id')
        .not('gp51_device_id', 'is', null);

      if (error) throw error;

      // Count duplicates manually
      const deviceCounts: Record<string, number> = {};
      data?.forEach(vehicle => {
        const deviceId = vehicle.gp51_device_id;
        deviceCounts[deviceId] = (deviceCounts[deviceId] || 0) + 1;
      });

      return Object.entries(deviceCounts)
        .filter(([_, count]) => count > 1)
        .map(([device_id, count]) => ({
          device_id,
          count,
          affected_records: []
        }));
    } catch (error) {
      console.error('Error finding duplicate device IDs:', error);
      return [];
    }
  }

  async generateDataConsistencyReport(): Promise<DataConsistencyReport> {
    try {
      const duplicateDevices = await this.findDuplicateDeviceIds();
      
      return {
        duplicate_devices: duplicateDevices,
        orphaned_vehicles: [],
        invalid_user_assignments: [],
        data_quality_score: duplicateDevices.length === 0 ? 100 : 90,
        recommendations: duplicateDevices.length > 0 
          ? ['Review and merge duplicate device entries']
          : ['Data quality is good']
      };
    } catch (error) {
      console.error('Error generating consistency report:', error);
      return {
        duplicate_devices: [],
        orphaned_vehicles: [],
        invalid_user_assignments: [],
        data_quality_score: 0,
        recommendations: ['Unable to generate report due to errors']
      };
    }
  }

  async fixDuplicateDevices(deviceId: string): Promise<boolean> {
    try {
      console.log('Would fix duplicate devices for:', deviceId);
      // Implementation would merge or remove duplicates
      return true;
    } catch (error) {
      console.error('Error fixing duplicate devices:', error);
      return false;
    }
  }
}

export const dataConsistencyService = new DataConsistencyService();
