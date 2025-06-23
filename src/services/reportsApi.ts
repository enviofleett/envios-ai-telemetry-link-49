
import { supabase } from '@/integrations/supabase/client';

export class ReportsApiService {
  async generateVehicleReport(filters: any): Promise<any> {
    console.log('Generating vehicle report with filters:', filters);
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('*');

    if (error) {
      console.error('Error generating report:', error);
      throw error;
    }

    return {
      success: true,
      data: data || [],
      timestamp: new Date().toISOString()
    };
  }

  async getVehicleUsageStats(): Promise<any> {
    console.log('Fetching vehicle usage statistics...');
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, gp51_device_id, name, user_id, created_at, updated_at');

    if (error) {
      console.error('Error fetching vehicle usage stats:', error);
      throw error;
    }

    const stats = {
      totalVehicles: data?.length || 0,
      activeVehicles: data?.filter(v => v.user_id).length || 0,
      averageUsage: 0, // Placeholder calculation
      usageByDay: [], // Placeholder data
      lastUpdated: new Date().toISOString()
    };

    return stats;
  }
}

export const reportsApi = new ReportsApiService();
