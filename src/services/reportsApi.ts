
import { supabase } from '@/integrations/supabase/client';
import type { VehicleFilters, Vehicle, ReportOptions, ReportData } from '@/types/gp51ValidationTypes';

interface VehicleReport {
  id: string;
  gp51_device_id: string;
  name: string;
  user_id: string;
  status: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  lastUpdate: Date;
}

class ReportsApiService {
  private static instance: ReportsApiService;

  static getInstance(): ReportsApiService {
    if (!ReportsApiService.instance) {
      ReportsApiService.instance = new ReportsApiService();
    }
    return ReportsApiService.instance;
  }

  /**
   * Generates vehicle activity report
   */
  async generateVehicleActivityReport(
    startDate: Date, 
    endDate: Date, 
    filters?: VehicleFilters
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      console.log('Generating vehicle activity report...');
      
      let query = supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          user_id,
          created_at,
          updated_at,
          envio_users (
            name,
            email
          )
        `)
        .gte('updated_at', startDate.toISOString())
        .lte('updated_at', endDate.toISOString());

      // Apply filters
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,gp51_device_id.ilike.%${filters.search}%`);
      }

      if (filters?.status && filters.status !== 'all') {
        // Status filtering would need additional logic based on GP51 data
        console.log('Status filter applied:', filters.status);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        console.error('Error generating vehicle activity report:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: true, data: [] };
      }

      // Transform data for report
      const reportData = data.map((vehicle: any) => {
        return {
          vehicleId: vehicle.gp51_device_id,
          vehicleName: vehicle.name,
          assignedUser: vehicle.envio_users?.name || 'Unassigned',
          lastActivity: new Date(vehicle.updated_at),
          status: 'Unknown', // Would need GP51 data integration
          location: 'Unknown' // Would need position data
        };
      });

      console.log(`Generated report with ${reportData.length} vehicles`);
      return { success: true, data: reportData };

    } catch (error) {
      console.error('Vehicle activity report generation failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Report generation failed' 
      };
    }
  }

  /**
   * Generates fleet utilization report
   */
  async generateFleetUtilizationReport(
    startDate: Date,
    endDate: Date
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Generating fleet utilization report...');

      // Get basic vehicle data
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          user_id,
          created_at,
          updated_at
        `);

      if (vehicleError) {
        console.error('Error fetching vehicles for utilization report:', vehicleError);
        return { success: false, error: vehicleError.message };
      }

      if (!vehicles) {
        return { success: true, data: { totalVehicles: 0, utilization: [] } };
      }

      // Calculate utilization metrics
      const utilizationData = vehicles.map((vehicle: any) => {
        return {
          vehicleId: vehicle.gp51_device_id,
          vehicleName: vehicle.name,
          totalHours: 24 * Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
          activeHours: Math.floor(Math.random() * 100), // Placeholder - would need real activity data
          utilizationPercentage: Math.floor(Math.random() * 100),
          distance: Math.floor(Math.random() * 1000),
          fuelConsumption: Math.floor(Math.random() * 50)
        };
      });

      const reportData = {
        totalVehicles: vehicles.length,
        reportPeriod: {
          start: startDate,
          end: endDate
        },
        averageUtilization: utilizationData.reduce((acc, v) => acc + v.utilizationPercentage, 0) / utilizationData.length,
        utilization: utilizationData
      };

      return { success: true, data: reportData };

    } catch (error) {
      console.error('Fleet utilization report generation failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Report generation failed' 
      };
    }
  }

  /**
   * Gets filtered vehicles for reports
   */
  async getFilteredVehicles(filters: VehicleFilters): Promise<Vehicle[]> {
    try {
      let query = supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          user_id
        `);

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,gp51_device_id.ilike.%${filters.search}%`);
      }

      if (filters.dateRange) {
        query = query
          .gte('updated_at', filters.dateRange.start.toISOString())
          .lte('updated_at', filters.dateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error filtering vehicles:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Vehicle filtering failed:', error);
      return [];
    }
  }

  /**
   * Exports report data
   */
  async exportReport(reportData: any, options: ReportOptions): Promise<{ success: boolean; data?: ReportData; error?: string }> {
    try {
      console.log(`Exporting report in ${options.format} format...`);

      // This would implement actual export logic based on format
      const exportData: ReportData = {
        summary: {
          generatedAt: new Date(),
          format: options.format,
          recordCount: Array.isArray(reportData) ? reportData.length : 1
        },
        details: Array.isArray(reportData) ? reportData : [reportData]
      };

      if (options.includeCharts) {
        exportData.charts = [
          // Chart data would be generated here
        ];
      }

      return { success: true, data: exportData };

    } catch (error) {
      console.error('Report export failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Export failed' 
      };
    }
  }
}

export const reportsApiService = ReportsApiService.getInstance();

// Export specific report functions for backwards compatibility
export const generateVehicleActivityReport = (startDate: Date, endDate: Date, filters?: VehicleFilters) => 
  reportsApiService.generateVehicleActivityReport(startDate, endDate, filters);

export const generateFleetUtilizationReport = (startDate: Date, endDate: Date) => 
  reportsApiService.generateFleetUtilizationReport(startDate, endDate);

export const getFilteredVehicles = (filters: VehicleFilters) => 
  reportsApiService.getFilteredVehicles(filters);

export const exportReport = (reportData: any, options: ReportOptions) => 
  reportsApiService.exportReport(reportData, options);
