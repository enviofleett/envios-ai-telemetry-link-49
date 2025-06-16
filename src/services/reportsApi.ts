// Mock Reports API Service
import { 
  type VehicleData 
} from '@/services/unifiedVehicleData';
import type { VehicleUsageStats } from '@/types/reports';
import { supabase } from '@/integrations/supabase/client';

export interface ReportQuery {
  vehicleIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  reportType: string;
  status?: string;
  geofenceIds?: string[];
  alertTypes?: string[];
  limit?: number;
}

export interface TripReport {
  id: string;
  vehicleId: string;
  vehicleName: string;
  startTime: string;
  endTime: string;
  duration: number; // seconds
  distance: number; // meters
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h
  fuelConsumed: number;
  idleTime: number;
  status: string;
}

export interface AlertReport {
  id: string;
  vehicleId: string;
  vehicleName: string;
  alertType: string;
  alertTime: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: { lat: number; lng: number };
  resolvedBy?: string;
  resolvedAt?: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

const calculateTripMetrics = (positions: any[]): Partial<TripReport> => {
  if (positions.length < 2) {
    return { distance: 0, averageSpeed: 0, maxSpeed: 0, duration: 0 };
  }

  let totalDistance = 0;
  let maxSpeed = 0;
  let totalIdleTime = 0;
  
  const startTime = new Date(positions[0].timestamp);
  const endTime = new Date(positions[positions.length - 1].timestamp);
  const duration = (endTime.getTime() - startTime.getTime()) / 1000; // seconds

  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];
    
    // Calculate distance using Haversine formula
    const lat1 = prev.lat * Math.PI / 180;
    const lat2 = curr.lat * Math.PI / 180;
    const deltaLat = (curr.lat - prev.lat) * Math.PI / 180;
    const deltaLng = (curr.lng - prev.lng) * Math.PI / 180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = 6371000 * c; // Earth's radius in meters
    
    totalDistance += distance;
    maxSpeed = Math.max(maxSpeed, curr.speed || 0);
    
    // Count idle time (speed < 2 km/h for more than 5 minutes)
    if ((curr.speed || 0) < 2) {
      const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
      if (timeDiff > 300) { // 5 minutes
        totalIdleTime += timeDiff;
      }
    }
  }

  const averageSpeed = duration > 0 ? (totalDistance / 1000) / (duration / 3600) : 0;

  return {
    distance: Math.round(totalDistance),
    averageSpeed: Math.round(averageSpeed),
    maxSpeed: Math.round(maxSpeed),
    duration: Math.round(duration),
    idleTime: Math.round(totalIdleTime)
  };
};

const generateTripReports = async (query: ReportQuery): Promise<TripReport[]> => {
  try {
    console.log('🚗 Generating trip reports with available data...');
    
    const dateFrom = query.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dateTo = query.dateTo || new Date();
    
    // Fetch vehicles with their position history using the correct table name
    let vehiclesQuery = supabase
      .from('vehicles')
      .select(`
        id,
        device_id,
        device_name
      `);
    
    if (query.vehicleIds && query.vehicleIds.length > 0) {
      vehiclesQuery = vehiclesQuery.in('device_id', query.vehicleIds);
    }
    
    const { data: vehicleData, error } = await vehiclesQuery
      .order('created_at', { ascending: true })
      .limit(query.limit || 100);

    if (error) {
      console.error('❌ Error fetching vehicle data:', error);
      throw new Error(`Failed to fetch vehicle data: ${error.message}`);
    }

    if (!vehicleData || vehicleData.length === 0) {
      console.log('📝 No vehicles found for trip reports');
      return [];
    }

    const reports: TripReport[] = vehicleData.map(vehicle => {
      // Generate mock trip data based on the vehicle
      const mockTrip = {
        id: `trip-${vehicle.device_id}-${Date.now()}`,
        vehicleId: vehicle.device_id,
        vehicleName: vehicle.device_name,
        startTime: dateFrom.toISOString(),
        endTime: dateTo.toISOString(),
        duration: Math.floor(Math.random() * 28800) + 3600, // 1-8 hours
        distance: Math.floor(Math.random() * 500000) + 50000, // 50-550 km in meters
        averageSpeed: Math.floor(Math.random() * 40) + 40, // 40-80 km/h
        maxSpeed: Math.floor(Math.random() * 50) + 80, // 80-130 km/h
        fuelConsumed: Math.floor(Math.random() * 40) + 20, // 20-60 liters
        idleTime: Math.floor(Math.random() * 1800) + 600, // 10-40 minutes
        status: 'completed'
      };
      
      return mockTrip;
    });
    
    console.log(`✅ Generated ${reports.length} trip reports`);
    return reports;
    
  } catch (error) {
    console.error('❌ Trip report generation failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate trip reports');
  }
};

const generateGeofenceReports = async (query: ReportQuery): Promise<any[]> => {
  console.warn('🚧 Geofence reports not yet implemented - using mock data');
  return [];
};

const generateMaintenanceReports = async (query: ReportQuery): Promise<any[]> => {
  console.warn('🚧 Maintenance reports not yet implemented - using mock data');
  return [];
};

const generateAlertReports = async (query: ReportQuery): Promise<AlertReport[]> => {
  try {
    console.log('🚨 Generating alert reports with mock data...');
    
    const dateFrom = query.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dateTo = query.dateTo || new Date();
    
    // Fetch vehicles first, then generate mock alerts
    let vehiclesQuery = supabase
      .from('vehicles')
      .select(`
        id,
        device_id,
        device_name
      `);
    
    if (query.vehicleIds && query.vehicleIds.length > 0) {
      vehiclesQuery = vehiclesQuery.in('device_id', query.vehicleIds);
    }
    
    const { data: vehicleData, error } = await vehiclesQuery
      .order('created_at', { ascending: false })
      .limit(query.limit || 100);

    if (error) {
      console.error('❌ Error fetching vehicle data for alerts:', error);
      throw new Error(`Failed to fetch vehicle data: ${error.message}`);
    }

    if (!vehicleData || vehicleData.length === 0) {
      console.log('📝 No vehicles found for alert reports');
      return [];
    }

    const reports: AlertReport[] = vehicleData.flatMap(vehicle => {
      // Generate 0-3 mock alerts per vehicle
      const alertCount = Math.floor(Math.random() * 4);
      const alerts = [];
      
      for (let i = 0; i < alertCount; i++) {
        const alertTypes = ['speeding', 'geofence_exit', 'maintenance_due', 'low_fuel', 'harsh_braking'];
        const severities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
        const statuses: ('active' | 'acknowledged' | 'resolved')[] = ['active', 'acknowledged', 'resolved'];
        
        alerts.push({
          id: `alert-${vehicle.device_id}-${i}-${Date.now()}`,
          vehicleId: vehicle.device_id,
          vehicleName: vehicle.device_name,
          alertType: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          alertTime: new Date(dateFrom.getTime() + Math.random() * (dateTo.getTime() - dateFrom.getTime())).toISOString(),
          severity: severities[Math.floor(Math.random() * severities.length)],
          description: `Mock alert for ${vehicle.device_name}`,
          location: {
            lat: -1.2921 + (Math.random() - 0.5) * 0.1, // Around Nairobi with some variance
            lng: 36.8219 + (Math.random() - 0.5) * 0.1
          },
          status: statuses[Math.floor(Math.random() * statuses.length)]
        });
      }
      
      return alerts;
    });
    
    console.log(`✅ Generated ${reports.length} alert reports`);
    return reports;
    
  } catch (error) {
    console.error('❌ Alert report generation failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate alert reports');
  }
};

const getVehicleUsageStats = async (vehicleIds?: string[]): Promise<VehicleUsageStats[]> => {
  try {
    console.log('📊 Calculating vehicle usage statistics...');
    
    let vehiclesQuery = supabase
      .from('vehicles')
      .select(`
        device_id,
        device_name
      `);
    
    if (vehicleIds && vehicleIds.length > 0) {
      vehiclesQuery = vehiclesQuery.in('device_id', vehicleIds);
    }
    
    const { data: vehicleData, error } = await vehiclesQuery;

    if (error) {
      console.error('❌ Error fetching vehicle data for usage stats:', error);
      throw new Error(`Failed to fetch vehicle data: ${error.message}`);
    }

    if (!vehicleData || vehicleData.length === 0) {
      console.log('📝 No vehicles found for usage stats');
      return [];
    }

    const stats: VehicleUsageStats[] = vehicleData.map(vehicle => {
      // Generate realistic mock usage statistics
      const totalMileage = Math.floor(Math.random() * 50000) + 10000; // 10k-60k km
      const fuelEfficiency = Math.floor(Math.random() * 5) + 8; // 8-13 km/l
      const averageSpeed = Math.floor(Math.random() * 20) + 45; // 45-65 km/h
      const utilizationRate = Math.random() * 0.4 + 0.6; // 60-100%
      const maintenanceScore = Math.floor(Math.random() * 30) + 70; // 70-100
      const totalTrips = Math.floor(Math.random() * 500) + 100; // 100-600 trips
      const idleTime = Math.floor(Math.random() * 200) + 50; // 50-250 hours
      const totalFuelConsumed = totalMileage / fuelEfficiency;
      
      return {
        totalMileage,
        fuelEfficiency,
        averageSpeed,
        utilizationRate: Number(utilizationRate.toFixed(2)),
        maintenanceScore,
        totalTrips,
        idleTime,
        totalFuelConsumed: Number(totalFuelConsumed.toFixed(1))
      };
    });
    
    console.log(`✅ Calculated usage stats for ${stats.length} vehicles`);
    return stats;
    
  } catch (error) {
    console.error('❌ Usage stats calculation failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to calculate usage statistics');
  }
};

const exportReportData = async (reportType: string, reportData: any[]): Promise<string> => {
  try {
    if (reportData.length === 0) {
      throw new Error('No data to export');
    }
    
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : String(value)
      ).join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to export data');
  }
};

export const reportsApi = {
  async getVehicleList(filters?: VehicleFilters): Promise<Vehicle[]> {
    try {
      console.log('Fetching vehicle list for reports...');
      
      let query = supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          user_id,
          sim_number,
          created_at,
          updated_at,
          envio_users (
            name,
            email
          )
        `);

      // Apply filters using correct column names
      if (filters?.assignedUserId) {
        query = query.eq('user_id', filters.assignedUserId);
      }

      if (filters?.deviceId) {
        query = query.eq('gp51_device_id', filters.deviceId);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      // Transform to expected format
      return data.map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id, // Map to expected field name
        device_name: vehicle.name, // Map to expected field name
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        user_email: vehicle.envio_users?.email,
        status: 'active',
        last_position: null,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at
      }));

    } catch (error) {
      console.error('Error in getVehicleList:', error);
      throw error;
    }
  },

  async generateVehicleReport(options: ReportOptions): Promise<ReportData> {
    try {
      console.log('Generating vehicle report with options:', options);
      
      const vehicles = await this.getVehicleList();
      
      // Filter vehicles based on date range if provided
      const filteredVehicles = vehicles.filter(vehicle => {
        if (!options.dateRange) return true;
        
        const vehicleDate = new Date(vehicle.updated_at);
        const startDate = new Date(options.dateRange.start);
        const endDate = new Date(options.dateRange.end);
        
        return vehicleDate >= startDate && vehicleDate <= endDate;
      });

      // Calculate summary data
      const summary = {
        total_vehicles: filteredVehicles.length,
        active_vehicles: filteredVehicles.filter(v => v.status === 'active').length,
        assigned_vehicles: filteredVehicles.filter(v => v.user_id).length,
        unassigned_vehicles: filteredVehicles.filter(v => !v.user_id).length
      };

      // Group vehicles by status for charts
      const chartData = [
        { name: 'Active', value: summary.active_vehicles, color: '#10b981' },
        { name: 'Inactive', value: summary.total_vehicles - summary.active_vehicles, color: '#ef4444' }
      ];

      return {
        id: crypto.randomUUID(),
        type: options.type,
        title: `Vehicle Report - ${options.type}`,
        generated_at: new Date().toISOString(),
        data: {
          vehicles: filteredVehicles.map(vehicle => ({
            device_id: vehicle.device_id,
            device_name: vehicle.device_name,
            status: vehicle.status,
            user_email: vehicle.user_email || 'Unassigned',
            last_update: vehicle.updated_at
          })),
          summary,
          charts: {
            vehicle_status: chartData
          }
        },
        metadata: {
          total_records: filteredVehicles.length,
          date_range: options.dateRange,
          filters_applied: options.filters || {}
        }
      };

    } catch (error) {
      console.error('Error generating vehicle report:', error);
      throw error;
    }
  },

  generateTripReports,
  generateGeofenceReports,
  generateMaintenanceReports,
  generateAlertReports,
  getVehicleUsageStats,
  exportReportData,
};
