
import { supabase } from '@/integrations/supabase/client';
import type { Vehicle } from '@/services/unifiedVehicleData';

export interface ReportQuery {
  vehicleIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  reportType: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface TripReport {
  id: string;
  vehicleId: string;
  vehicleName: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  distance: number; // in meters
  averageSpeed: number;
  maxSpeed: number;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  fuelConsumed?: number;
  idleTime?: number;
  status: 'completed' | 'in_progress' | 'cancelled';
}

export interface GeofenceReport {
  id: string;
  vehicleId: string;
  vehicleName: string;
  geofenceName: string;
  eventType: 'enter' | 'exit';
  eventTime: string;
  location: { lat: number; lng: number };
  duration?: number; // time spent inside in minutes
  violationType?: 'authorized' | 'unauthorized';
}

export interface MaintenanceReport {
  id: string;
  vehicleId: string;
  vehicleName: string;
  maintenanceType: string;
  scheduledDate: string;
  completedDate?: string;
  cost?: number;
  mileageAtService?: number;
  serviceProvider: string;
  nextServiceDue?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
}

export interface AlertReport {
  id: string;
  vehicleId: string;
  vehicleName: string;
  alertType: string;
  alertTime: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: { lat: number; lng: number };
  resolvedAt?: string;
  resolvedBy?: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export class ReportsApiService {
  async generateTripReports(query: ReportQuery): Promise<TripReport[]> {
    // For now, we'll generate realistic data based on actual vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('device_id, device_name')
      .eq('is_active', true);

    if (!vehicles) return [];

    const filteredVehicles = query.vehicleIds?.length 
      ? vehicles.filter(v => query.vehicleIds!.includes(v.device_id))
      : vehicles;

    return filteredVehicles.slice(0, query.limit || 50).map((vehicle, index) => {
      const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const duration = Math.floor(Math.random() * 480 + 30); // 30 minutes to 8 hours
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      const distance = Math.floor(Math.random() * 500000 + 10000); // 10km to 500km in meters
      
      return {
        id: `trip-${vehicle.device_id}-${index}`,
        vehicleId: vehicle.device_id,
        vehicleName: vehicle.device_name || vehicle.device_id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        distance,
        averageSpeed: Math.floor(distance / 1000 / (duration / 60)), // km/h
        maxSpeed: Math.floor(Math.random() * 40 + 80), // 80-120 km/h
        startLocation: {
          lat: 40.7128 + (Math.random() - 0.5) * 0.1,
          lng: -74.0060 + (Math.random() - 0.5) * 0.1
        },
        endLocation: {
          lat: 40.7128 + (Math.random() - 0.5) * 0.1,
          lng: -74.0060 + (Math.random() - 0.5) * 0.1
        },
        fuelConsumed: Math.floor(distance / 10000), // rough estimate
        idleTime: Math.floor(Math.random() * 60),
        status: Math.random() > 0.9 ? 'cancelled' : 'completed' as 'completed' | 'cancelled'
      };
    });
  }

  async generateGeofenceReports(query: ReportQuery): Promise<GeofenceReport[]> {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('device_id, device_name')
      .eq('is_active', true);

    if (!vehicles) return [];

    const { data: geofences } = await supabase
      .from('geofences')
      .select('name')
      .eq('is_active', true);

    const geofenceNames = geofences?.map(g => g.name) || ['Warehouse A', 'Customer Site B', 'Depot C'];
    
    const filteredVehicles = query.vehicleIds?.length 
      ? vehicles.filter(v => query.vehicleIds!.includes(v.device_id))
      : vehicles;

    return filteredVehicles.slice(0, query.limit || 30).map((vehicle, index) => ({
      id: `geofence-${vehicle.device_id}-${index}`,
      vehicleId: vehicle.device_id,
      vehicleName: vehicle.device_name || vehicle.device_id,
      geofenceName: geofenceNames[Math.floor(Math.random() * geofenceNames.length)],
      eventType: Math.random() > 0.5 ? 'enter' : 'exit' as 'enter' | 'exit',
      eventTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.0060 + (Math.random() - 0.5) * 0.1
      },
      duration: Math.random() > 0.5 ? Math.floor(Math.random() * 240 + 10) : undefined,
      violationType: Math.random() > 0.8 ? 'unauthorized' : 'authorized'
    }));
  }

  async generateMaintenanceReports(query: ReportQuery): Promise<MaintenanceReport[]> {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('device_id, device_name')
      .eq('is_active', true);

    if (!vehicles) return [];

    const maintenanceTypes = [
      'Oil Change', 'Tire Rotation', 'Brake Inspection', 
      'Engine Service', 'Transmission Check', 'Battery Replacement'
    ];

    const serviceProviders = [
      'AutoService Pro', 'Fleet Maintenance Inc', 'QuickFix Garage', 'Elite Auto Care'
    ];

    const filteredVehicles = query.vehicleIds?.length 
      ? vehicles.filter(v => query.vehicleIds!.includes(v.device_id))
      : vehicles;

    return filteredVehicles.slice(0, query.limit || 20).map((vehicle, index) => {
      const scheduledDate = new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000);
      const isCompleted = Math.random() > 0.4;
      const isOverdue = !isCompleted && scheduledDate < new Date();

      return {
        id: `maintenance-${vehicle.device_id}-${index}`,
        vehicleId: vehicle.device_id,
        vehicleName: vehicle.device_name || vehicle.device_id,
        maintenanceType: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
        scheduledDate: scheduledDate.toISOString(),
        completedDate: isCompleted ? new Date(scheduledDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        cost: isCompleted ? Math.floor(Math.random() * 800 + 100) : undefined,
        mileageAtService: Math.floor(Math.random() * 100000 + 50000),
        serviceProvider: serviceProviders[Math.floor(Math.random() * serviceProviders.length)],
        nextServiceDue: new Date(scheduledDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: isOverdue ? 'overdue' : isCompleted ? 'completed' : 'scheduled'
      };
    });
  }

  async generateAlertReports(query: ReportQuery): Promise<AlertReport[]> {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('device_id, device_name')
      .eq('is_active', true);

    if (!vehicles) return [];

    const alertTypes = [
      'Speed Violation', 'Geofence Breach', 'Engine Warning', 
      'Low Fuel', 'Maintenance Due', 'Security Alert', 'GPS Signal Lost'
    ];

    const filteredVehicles = query.vehicleIds?.length 
      ? vehicles.filter(v => query.vehicleIds!.includes(v.device_id))
      : vehicles;

    return filteredVehicles.slice(0, query.limit || 25).map((vehicle, index) => {
      const alertTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const isResolved = Math.random() > 0.3;
      const isAcknowledged = !isResolved && Math.random() > 0.5;

      return {
        id: `alert-${vehicle.device_id}-${index}`,
        vehicleId: vehicle.device_id,
        vehicleName: vehicle.device_name || vehicle.device_id,
        alertType: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        alertTime: alertTime.toISOString(),
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical',
        description: `Alert detected for ${vehicle.device_name || vehicle.device_id}. Immediate attention may be required.`,
        location: {
          lat: 40.7128 + (Math.random() - 0.5) * 0.1,
          lng: -74.0060 + (Math.random() - 0.5) * 0.1
        },
        resolvedAt: isResolved ? new Date(alertTime.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString() : undefined,
        resolvedBy: isResolved ? 'Fleet Manager' : undefined,
        status: isResolved ? 'resolved' : isAcknowledged ? 'acknowledged' : 'active'
      };
    });
  }

  async getVehicleUsageStats(vehicleIds?: string[]): Promise<any> {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('device_id, device_name, created_at')
      .eq('is_active', true);

    if (!vehicles) return {};

    const filteredVehicles = vehicleIds?.length 
      ? vehicles.filter(v => vehicleIds.includes(v.device_id))
      : vehicles;

    return {
      totalVehicles: filteredVehicles.length,
      averageAge: Math.floor(Math.random() * 5 + 1), // years
      totalMileage: Math.floor(Math.random() * 1000000 + 500000),
      fuelEfficiency: (Math.random() * 5 + 8).toFixed(1), // km/L
      utilizationRate: Math.floor(Math.random() * 40 + 60) // percentage
    };
  }

  async exportReportData(reportType: string, data: any[]): Promise<string> {
    // Enhanced CSV export with proper formatting
    if (data.length === 0) return '';

    let headers: string[] = [];
    let csvRows: string[] = [];

    switch (reportType) {
      case 'trip':
        headers = ['Vehicle ID', 'Vehicle Name', 'Start Time', 'End Time', 'Duration (min)', 'Distance (km)', 'Avg Speed (km/h)', 'Max Speed (km/h)', 'Fuel (L)', 'Idle Time (min)', 'Status'];
        csvRows = data.map((trip: TripReport) => [
          trip.vehicleId,
          trip.vehicleName,
          new Date(trip.startTime).toLocaleString(),
          new Date(trip.endTime).toLocaleString(),
          trip.duration.toString(),
          (trip.distance / 1000).toFixed(1),
          trip.averageSpeed.toString(),
          trip.maxSpeed.toString(),
          trip.fuelConsumed?.toString() || '',
          trip.idleTime?.toString() || '',
          trip.status
        ].map(field => `"${field}"`).join(','));
        break;

      case 'geofence':
        headers = ['Vehicle ID', 'Vehicle Name', 'Geofence', 'Event Type', 'Event Time', 'Duration (min)', 'Latitude', 'Longitude', 'Violation Type'];
        csvRows = data.map((geo: GeofenceReport) => [
          geo.vehicleId,
          geo.vehicleName,
          geo.geofenceName,
          geo.eventType,
          new Date(geo.eventTime).toLocaleString(),
          geo.duration?.toString() || '',
          geo.location.lat.toFixed(6),
          geo.location.lng.toFixed(6),
          geo.violationType || ''
        ].map(field => `"${field}"`).join(','));
        break;

      case 'maintenance':
        headers = ['Vehicle ID', 'Vehicle Name', 'Service Type', 'Scheduled Date', 'Completed Date', 'Cost', 'Mileage', 'Service Provider', 'Next Service', 'Status'];
        csvRows = data.map((maint: MaintenanceReport) => [
          maint.vehicleId,
          maint.vehicleName,
          maint.maintenanceType,
          new Date(maint.scheduledDate).toLocaleDateString(),
          maint.completedDate ? new Date(maint.completedDate).toLocaleDateString() : '',
          maint.cost?.toString() || '',
          maint.mileageAtService?.toString() || '',
          maint.serviceProvider,
          maint.nextServiceDue ? new Date(maint.nextServiceDue).toLocaleDateString() : '',
          maint.status
        ].map(field => `"${field}"`).join(','));
        break;

      case 'alerts':
        headers = ['Vehicle ID', 'Vehicle Name', 'Alert Type', 'Alert Time', 'Severity', 'Description', 'Location', 'Resolved At', 'Resolved By', 'Status'];
        csvRows = data.map((alert: AlertReport) => [
          alert.vehicleId,
          alert.vehicleName,
          alert.alertType,
          new Date(alert.alertTime).toLocaleString(),
          alert.severity,
          alert.description,
          alert.location ? `${alert.location.lat.toFixed(6)}, ${alert.location.lng.toFixed(6)}` : '',
          alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : '',
          alert.resolvedBy || '',
          alert.status
        ].map(field => `"${field}"`).join(','));
        break;
    }

    return [headers.join(','), ...csvRows].join('\n');
  }
}

export const reportsApi = new ReportsApiService();
