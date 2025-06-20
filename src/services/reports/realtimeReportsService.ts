
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

export interface TripReportData {
  totalTrips: number;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  trips: any[];
}

export interface GeofenceReportData {
  totalGeofences: number;
  activeGeofences: number;
  violations: number;
  entriesExits: { date: string; entries: number; exits: number }[];
  violationsByZone: { zone: string; violations: number }[];
  violationsByVehicle: { vehicle: string; violations: number }[];
}

export interface MaintenanceReportData {
  totalMaintenanceEvents: number;
  upcomingMaintenance: number;
  overdueMaintenenance: number;
  totalMaintenanceCost: number;
  maintenanceByType: any[];
  events: any[];
}

export interface AlertReportData {
  totalAlerts: number;
  resolvedAlerts: number;
  pendingAlerts: number;
  alertsByType: { type: string; count: number; severity: string }[];
  alertsByVehicle: { vehicle: string; count: number }[];
  alertsTrend: { date: string; count: number }[];
}

export interface MileageReportData {
  totalMileage: number;
  averageMileage: number;
  mileageByVehicle: { vehicle: string; mileage: number; efficiency: number }[];
  mileageTrends: { date: string; mileage: number; fuelUsed: number }[];
  monthlyMileage: { month: string; mileage: number }[];
}

class RealtimeReportsService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private subscriptions = new Map<string, () => void>();

  async getReportMetrics(): Promise<ReportMetrics> {
    const cacheKey = 'report_metrics';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const { data: vehicles } = await supabase.from('vehicles').select('*');
      const totalVehicles = vehicles?.length || 0;
      
      const metrics: ReportMetrics = {
        totalVehicles,
        activeVehicles: Math.round(totalVehicles * 0.85),
        totalMileage: Math.round(totalVehicles * 12500),
        fuelEfficiency: 28.5,
        averageSpeed: 42.3,
        alertCount: Math.round(totalVehicles * 0.15),
        maintenanceCount: Math.round(totalVehicles * 0.08),
        utilizationRate: 0.85
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching report metrics:', error);
      throw error;
    }
  }

  subscribeToVehicleUpdates(callback: (data: any) => void): () => void {
    const subscriptionId = Math.random().toString(36);
    
    const channel = supabase
      .channel('vehicle-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vehicles'
      }, callback)
      .subscribe();

    const unsubscribe = () => {
      supabase.removeChannel(channel);
      this.subscriptions.delete(subscriptionId);
    };

    this.subscriptions.set(subscriptionId, unsubscribe);
    return unsubscribe;
  }

  unsubscribe(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }

  async generateFleetReport(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    vehicleIds?: string[];
  }): Promise<ReportData> {
    const cacheKey = `fleet_report_${JSON.stringify(filters)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
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
  }): Promise<TripReportData> {
    console.log('Generating trip report with filters:', filters);
    
    const mockTripData: TripReportData = {
      totalTrips: 156,
      totalDistance: 2847.5,
      totalDuration: 1284,
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

  async generateGeofenceReport(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    vehicleIds?: string[];
  }): Promise<GeofenceReportData> {
    console.log('Generating geofence report with filters:', filters);
    
    const mockGeofenceData: GeofenceReportData = {
      totalGeofences: 25,
      activeGeofences: 20,
      violations: 8,
      entriesExits: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        entries: Math.round(Math.random() * 50 + 20),
        exits: Math.round(Math.random() * 50 + 20)
      })),
      violationsByZone: [
        { zone: 'Downtown Area', violations: 3 },
        { zone: 'Industrial Zone', violations: 2 },
        { zone: 'Highway Restriction', violations: 2 },
        { zone: 'Residential Area', violations: 1 }
      ],
      violationsByVehicle: [
        { vehicle: 'Vehicle-001', violations: 4 },
        { vehicle: 'Vehicle-003', violations: 2 },
        { vehicle: 'Vehicle-007', violations: 2 }
      ]
    };

    return mockGeofenceData;
  }

  async generateMaintenanceReport(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    vehicleIds?: string[];
  }): Promise<MaintenanceReportData> {
    console.log('Generating maintenance report with filters:', filters);
    
    const mockMaintenanceData: MaintenanceReportData = {
      totalMaintenanceEvents: 23,
      upcomingMaintenance: 8,
      overdueMaintenenance: 2,
      totalMaintenanceCost: 15647.50,
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

  async generateAlertReport(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    vehicleIds?: string[];
  }): Promise<AlertReportData> {
    console.log('Generating alert report with filters:', filters);
    
    const mockAlertData: AlertReportData = {
      totalAlerts: 45,
      resolvedAlerts: 32,
      pendingAlerts: 13,
      alertsByType: [
        { type: 'Speed Violation', count: 15, severity: 'high' },
        { type: 'Geofence Breach', count: 8, severity: 'medium' },
        { type: 'Maintenance Due', count: 12, severity: 'low' },
        { type: 'Engine Issue', count: 6, severity: 'high' },
        { type: 'Battery Low', count: 4, severity: 'medium' }
      ],
      alertsByVehicle: [
        { vehicle: 'Vehicle-001', count: 12 },
        { vehicle: 'Vehicle-003', count: 8 },
        { vehicle: 'Vehicle-007', count: 7 },
        { vehicle: 'Vehicle-002', count: 6 },
        { vehicle: 'Vehicle-005', count: 5 }
      ],
      alertsTrend: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        count: Math.round(Math.random() * 8 + 2)
      }))
    };

    return mockAlertData;
  }

  async generateMileageReport(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    vehicleIds?: string[];
  }): Promise<MileageReportData> {
    console.log('Generating mileage report with filters:', filters);
    
    const mockMileageData: MileageReportData = {
      totalMileage: 125430,
      averageMileage: 4181,
      mileageByVehicle: Array.from({ length: 10 }, (_, i) => ({
        vehicle: `Vehicle-${String(i + 1).padStart(3, '0')}`,
        mileage: Math.round(Math.random() * 5000 + 10000),
        efficiency: Math.round((Math.random() * 10 + 25) * 10) / 10
      })),
      mileageTrends: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        mileage: Math.round(Math.random() * 500 + 200),
        fuelUsed: Math.round(Math.random() * 50 + 20)
      })),
      monthlyMileage: [
        { month: 'Jan', mileage: 12450 },
        { month: 'Feb', mileage: 11280 },
        { month: 'Mar', mileage: 13120 },
        { month: 'Apr', mileage: 12890 },
        { month: 'May', mileage: 13560 },
        { month: 'Jun', mileage: 12340 }
      ]
    };

    return mockMileageData;
  }

  private processFleetData(vehicles: any[]): ReportData {
    const totalVehicles = vehicles.length;
    const activeVehicles = Math.round(totalVehicles * 0.85);
    
    const metrics: ReportMetrics = {
      totalVehicles,
      activeVehicles,
      totalMileage: Math.round(totalVehicles * 12500),
      fuelEfficiency: 28.5,
      averageSpeed: 42.3,
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
