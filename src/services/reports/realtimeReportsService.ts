import { supabase } from '@/integrations/supabase/client';
import type { ReportMetrics } from '@/types/reports';

export interface TripReportData {
  id: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
  distance: number;
  duration: number;
  averageSpeed: number;
  startLocation: string;
  endLocation: string;
}

export interface GeofenceReportData {
  id: string;
  vehicleId: string;
  geofenceName: string;
  eventType: 'entry' | 'exit' | 'violation';
  timestamp: string;
  location: { lat: number; lng: number };
}

export interface MaintenanceReportData {
  id: string;
  vehicleId: string;
  maintenanceType: string;
  scheduledDate: string;
  completedDate?: string;
  cost: number;
  status: 'scheduled' | 'completed' | 'overdue';
}

export interface AlertReportData {
  id: string;
  vehicleId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  description: string;
  status: 'active' | 'resolved';
}

export interface MileageReportData {
  id: string;
  vehicleId: string;
  date: string;
  mileage: number;
  fuelUsed: number;
  efficiency: number;
}

export interface FleetReportData {
  totalVehicles: number;
  activeVehicles: number;
  totalMileage: number;
  totalTrips: number;
  averageSpeed: number;
  fuelEfficiency: number;
  utilizationRate: number;
  vehicleBreakdown: Array<{
    vehicle: string;
    status: string;
    mileage: number;
    trips: number;
  }>;
}

class RealtimeReportsService {
  private subscriptions = new Map<string, any>();

  async getReportMetrics(filters?: any, options?: any): Promise<ReportMetrics> {
    console.log('Getting report metrics with filters:', filters, 'and options:', options);
    
    return {
      totalReports: 150,
      lastGenerated: new Date().toISOString(),
      averageGenerationTime: 2.5,
      popularReportTypes: ['fleet_summary', 'trip_analysis', 'maintenance'],
      totalVehicles: 25,
      activeVehicles: 20,
      alertCount: 12,
      averageSpeed: 45.5,
      totalMileage: 25000,
      fuelEfficiency: 12.5,
      utilizationRate: 0.78
    };
  }

  subscribeToVehicleUpdates(callback: (data: any) => void, filters?: any): string {
    console.log('Subscribing to vehicle updates with filters:', filters);
    
    const subscriptionKey = `vehicle_updates_${Date.now()}`;
    
    const channel = supabase
      .channel(subscriptionKey)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vehicles'
      }, callback)
      .subscribe();

    this.subscriptions.set(subscriptionKey, channel);
    return subscriptionKey;
  }

  unsubscribe(subscriptionKey: string): void {
    const channel = this.subscriptions.get(subscriptionKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(subscriptionKey);
    }
  }

  async generateFleetReport(filters: any): Promise<FleetReportData> {
    console.log('Generating fleet report with filters:', filters);
    
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('*');

    return {
      totalVehicles: vehicles?.length || 0,
      activeVehicles: vehicles?.filter(v => v.is_active).length || 0,
      totalMileage: 25000,
      totalTrips: 1250,
      averageSpeed: 45.5,
      fuelEfficiency: 12.5,
      utilizationRate: 0.78,
      vehicleBreakdown: vehicles?.map(v => ({
        vehicle: v.name || v.gp51_device_id,
        status: v.is_active ? 'active' : 'inactive',
        mileage: Math.random() * 1000,
        trips: Math.floor(Math.random() * 50)
      })) || []
    };
  }

  async generateTripReport(filters: any): Promise<{
    totalTrips: number;
    totalDistance: number;
    totalDuration: number;
    averageSpeed: number;
    trips: TripReportData[];
  }> {
    console.log('Generating trip report with filters:', filters);
    
    const mockTrips: TripReportData[] = [
      {
        id: '1',
        vehicleId: 'vehicle-1',
        startTime: '2024-01-01T08:00:00Z',
        endTime: '2024-01-01T10:30:00Z',
        distance: 125.5,
        duration: 150,
        averageSpeed: 50.2,
        startLocation: 'Office A',
        endLocation: 'Client Site B'
      }
    ];

    return {
      totalTrips: mockTrips.length,
      totalDistance: mockTrips.reduce((sum, trip) => sum + trip.distance, 0),
      totalDuration: mockTrips.reduce((sum, trip) => sum + trip.duration, 0),
      averageSpeed: mockTrips.reduce((sum, trip) => sum + trip.averageSpeed, 0) / mockTrips.length,
      trips: mockTrips
    };
  }

  async generateGeofenceReport(filters: any): Promise<{
    totalGeofences: number;
    activeGeofences: number;
    violations: number;
    entriesExits: { date: string; entries: number; exits: number }[];
    violationsByZone: { zone: string; violations: number }[];
    violationsByVehicle: { vehicle: string; violations: number }[];
  }> {
    console.log('Generating geofence report with filters:', filters);
    
    return {
      totalGeofences: 15,
      activeGeofences: 12,
      violations: 23,
      entriesExits: [
        { date: '2024-01-01', entries: 45, exits: 43 },
        { date: '2024-01-02', entries: 52, exits: 50 }
      ],
      violationsByZone: [
        { zone: 'Restricted Area A', violations: 8 },
        { zone: 'Speed Zone B', violations: 15 }
      ],
      violationsByVehicle: [
        { vehicle: 'Vehicle-001', violations: 5 },
        { vehicle: 'Vehicle-002', violations: 3 }
      ]
    };
  }

  async generateMaintenanceReport(filters: any): Promise<{
    totalMaintenanceEvents: number;
    upcomingMaintenance: number;
    overdueMaintenenance: number;
    totalMaintenanceCost: number;
    maintenanceByType: any[];
    events: MaintenanceReportData[];
  }> {
    console.log('Generating maintenance report with filters:', filters);
    
    const mockEvents: MaintenanceReportData[] = [
      {
        id: '1',
        vehicleId: 'vehicle-1',
        maintenanceType: 'Oil Change',
        scheduledDate: '2024-01-15',
        completedDate: '2024-01-15',
        cost: 75.50,
        status: 'completed'
      }
    ];

    return {
      totalMaintenanceEvents: mockEvents.length,
      upcomingMaintenance: 5,
      overdueMaintenenance: 2,
      totalMaintenanceCost: mockEvents.reduce((sum, event) => sum + event.cost, 0),
      maintenanceByType: [
        { type: 'Oil Change', count: 12, cost: 900 },
        { type: 'Tire Replacement', count: 8, cost: 1600 }
      ],
      events: mockEvents
    };
  }

  async generateAlertReport(filters: any): Promise<{
    totalAlerts: number;
    resolvedAlerts: number;
    pendingAlerts: number;
    alertsByType: { type: string; count: number; severity: string }[];
    alertsByVehicle: { vehicle: string; count: number }[];
    alertsTrend: { date: string; alerts: number }[];
  }> {
    console.log('Generating alert report with filters:', filters);
    
    return {
      totalAlerts: 45,
      resolvedAlerts: 32,
      pendingAlerts: 13,
      alertsByType: [
        { type: 'Speed Violation', count: 15, severity: 'medium' },
        { type: 'Geofence Breach', count: 8, severity: 'high' }
      ],
      alertsByVehicle: [
        { vehicle: 'Vehicle-001', count: 12 },
        { vehicle: 'Vehicle-002', count: 8 }
      ],
      alertsTrend: [
        { date: '2024-01-01', alerts: 5 },
        { date: '2024-01-02', alerts: 8 }
      ]
    };
  }

  async generateMileageReport(filters: any): Promise<{
    totalMileage: number;
    averageMileage: number;
    mileageByVehicle: { vehicle: string; mileage: number; efficiency: number }[];
    mileageTrends: { date: string; mileage: number; fuelUsed: number }[];
    monthlyMileage: { month: string; mileage: number }[];
  }> {
    console.log('Generating mileage report with filters:', filters);
    
    return {
      totalMileage: 15000,
      averageMileage: 750,
      mileageByVehicle: [
        { vehicle: 'Vehicle-001', mileage: 1200, efficiency: 12.5 },
        { vehicle: 'Vehicle-002', mileage: 950, efficiency: 14.2 }
      ],
      mileageTrends: [
        { date: '2024-01-01', mileage: 250, fuelUsed: 20.5 },
        { date: '2024-01-02', mileage: 320, fuelUsed: 25.8 }
      ],
      monthlyMileage: [
        { month: 'January', mileage: 5000 },
        { month: 'February', mileage: 4800 }
      ]
    };
  }
}

export const realtimeReportsService = new RealtimeReportsService();
