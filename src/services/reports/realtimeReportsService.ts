
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

export interface ReportMetrics {
  totalVehicles: number;
  activeVehicles: number;
  totalMileage: number;
  fuelEfficiency: number;
  averageSpeed: number;
  alertCount: number;
  maintenanceCount: number;
  utilizationRate: number;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label: string;
}

export interface ReportData {
  metrics: ReportMetrics;
  timeSeries: TimeSeriesData[];
  charts: {
    vehicleStatus: { name: string; value: number; color: string }[];
    speedDistribution: { range: string; count: number }[];
    alertsByType: { type: string; count: number; severity: string }[];
    mileageByVehicle: { vehicle: string; mileage: number }[];
  };
}

class RealtimeReportsService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async generateFleetReport(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    vehicleIds?: string[];
  }): Promise<ReportData> {
    const cacheKey = `fleet_report_${JSON.stringify(filters)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Fetch vehicles data
      let vehiclesQuery = supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          user_id,
          created_at,
          updated_at
        `);

      if (filters.vehicleIds?.length) {
        vehiclesQuery = vehiclesQuery.in('gp51_device_id', filters.vehicleIds);
      }

      const { data: vehicles, error } = await vehiclesQuery;
      if (error) throw error;

      const reportData = this.processFleetData(vehicles || []);
      this.setCachedData(cacheKey, reportData);
      return reportData;
    } catch (error) {
      console.error('Error generating fleet report:', error);
      throw error;
    }
  }

  async generateTripReport(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    vehicleIds?: string[];
  }): Promise<any> {
    console.log('Generating trip report with filters:', filters);
    
    // Simulate trip data - in real implementation, fetch from GP51 or vehicle_positions table
    const mockTripData = {
      totalTrips: 156,
      totalDistance: 2847.5,
      totalDuration: 1284, // minutes
      averageSpeed: 45.2,
      trips: Array.from({ length: 10 }, (_, i) => ({
        id: `trip-${i + 1}`,
        vehicleId: `vehicle-${i % 3 + 1}`,
        startTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
        endTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000)).toISOString(),
        distance: Math.round(Math.random() * 200 + 50),
        duration: Math.round(Math.random() * 120 + 30),
        averageSpeed: Math.round(Math.random() * 30 + 35),
        maxSpeed: Math.round(Math.random() * 20 + 80),
        startLocation: `Location ${i + 1}`,
        endLocation: `Destination ${i + 1}`
      }))
    };

    return mockTripData;
  }

  async generateMaintenanceReport(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    vehicleIds?: string[];
  }): Promise<any> {
    console.log('Generating maintenance report with filters:', filters);
    
    // Simulate maintenance data
    const mockMaintenanceData = {
      totalMaintenanceEvents: 23,
      upcomingMaintenance: 8,
      overdueMaintenance: 2,
      totalMaintenanceCost: 15647.50,
      averageCostPerVehicle: 1564.75,
      maintenanceByType: [
        { type: 'Oil Change', count: 12, avgCost: 150 },
        { type: 'Brake Inspection', count: 6, avgCost: 300 },
        { type: 'Tire Rotation', count: 8, avgCost: 100 },
        { type: 'Engine Service', count: 4, avgCost: 800 }
      ],
      events: Array.from({ length: 15 }, (_, i) => ({
        id: `maintenance-${i + 1}`,
        vehicleId: `vehicle-${i % 3 + 1}`,
        type: ['Oil Change', 'Brake Inspection', 'Tire Rotation', 'Engine Service'][i % 4],
        date: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        cost: Math.round(Math.random() * 500 + 100),
        status: ['completed', 'scheduled', 'overdue'][i % 3],
        mileage: Math.round(Math.random() * 10000 + 50000)
      }))
    };

    return mockMaintenanceData;
  }

  private processFleetData(vehicles: any[]): ReportData {
    const totalVehicles = vehicles.length;
    const activeVehicles = Math.round(totalVehicles * 0.85); // Simulate active percentage
    
    const metrics: ReportMetrics = {
      totalVehicles,
      activeVehicles,
      totalMileage: Math.round(totalVehicles * 12500), // Simulate annual mileage
      fuelEfficiency: 28.5, // MPG
      averageSpeed: 42.3, // MPH
      alertCount: Math.round(totalVehicles * 0.15),
      maintenanceCount: Math.round(totalVehicles * 0.08),
      utilizationRate: 0.85
    };

    const timeSeries: TimeSeriesData[] = Array.from({ length: 30 }, (_, i) => ({
      timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
      value: Math.round(Math.random() * 20 + 80),
      label: `Day ${i + 1}`
    }));

    const charts = {
      vehicleStatus: [
        { name: 'Active', value: activeVehicles, color: '#10b981' },
        { name: 'Idle', value: Math.round(totalVehicles * 0.1), color: '#f59e0b' },
        { name: 'Offline', value: totalVehicles - activeVehicles - Math.round(totalVehicles * 0.1), color: '#ef4444' }
      ],
      speedDistribution: [
        { range: '0-20 mph', count: Math.round(totalVehicles * 0.1) },
        { range: '21-40 mph', count: Math.round(totalVehicles * 0.3) },
        { range: '41-60 mph', count: Math.round(totalVehicles * 0.4) },
        { range: '61+ mph', count: Math.round(totalVehicles * 0.2) }
      ],
      alertsByType: [
        { type: 'Speed', count: Math.round(totalVehicles * 0.05), severity: 'high' },
        { type: 'Geofence', count: Math.round(totalVehicles * 0.03), severity: 'medium' },
        { type: 'Maintenance', count: Math.round(totalVehicles * 0.07), severity: 'low' }
      ],
      mileageByVehicle: vehicles.slice(0, 10).map((vehicle, i) => ({
        vehicle: vehicle.name || `Vehicle ${i + 1}`,
        mileage: Math.round(Math.random() * 5000 + 10000)
      }))
    };

    return { metrics, timeSeries, charts };
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const realtimeReportsService = new RealtimeReportsService();
