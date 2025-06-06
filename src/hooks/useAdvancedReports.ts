
import { useState, useCallback } from 'react';
import { geofencingService } from '@/services/geofencing';
import type { Vehicle } from '@/services/unifiedVehicleData';

export type ReportType = 'trip' | 'activity' | 'maintenance' | 'alerts' | 'geofence' | 'mileage';

export interface ReportFilters {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  vehicleIds: string[];
  reportType: ReportType;
  status?: string;
  geofenceIds?: string[];
  alertTypes?: string[];
}

export interface TripReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: string;
  startTime: string;
  endTime: string;
  duration: string;
  distance: string;
  averageSpeed: string;
  maxSpeed: string;
  route?: { lat: number; lng: number }[];
  fuelConsumption?: string;
  idleTime?: string;
  status: string;
}

export interface GeofenceReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  geofenceName: string;
  eventType: 'enter' | 'exit';
  eventTime: string;
  duration?: string;
  location: { lat: number; lng: number };
  status: string;
}

export interface MaintenanceReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  maintenanceType: string;
  scheduledDate: string;
  completedDate?: string;
  cost?: string;
  serviceProvider?: string;
  nextServiceDue?: string;
  status: 'scheduled' | 'completed' | 'overdue';
}

export interface AlertReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  alertType: string;
  alertTime: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: { lat: number; lng: number };
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface MileageReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  period: string;
  totalDistance: string;
  averageDistance: string;
  fuelConsumption: string;
  fuelEfficiency: string;
  costPerMile: string;
  utilizationRate: string;
}

export type ReportData = TripReportData | GeofenceReportData | MaintenanceReportData | AlertReportData | MileageReportData;

export const useAdvancedReports = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [activeTab, setActiveTab] = useState<ReportType>('trip');
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
    vehicleIds: [],
    reportType: 'trip',
  });

  const generateTripReports = useCallback((vehicles: Vehicle[]): TripReportData[] => {
    return vehicles.slice(0, 15).map((vehicle, index) => ({
      id: `trip-${vehicle.deviceid}-${index}`,
      vehicleId: vehicle.deviceid,
      vehicleName: vehicle.devicename,
      type: 'Trip',
      startTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString(),
      endTime: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toLocaleString(),
      duration: `${Math.floor(Math.random() * 8 + 1)}h ${Math.floor(Math.random() * 60)}m`,
      distance: `${Math.floor(Math.random() * 500 + 50)} km`,
      averageSpeed: `${Math.floor(Math.random() * 60 + 20)} km/h`,
      maxSpeed: `${Math.floor(Math.random() * 40 + 80)} km/h`,
      fuelConsumption: `${(Math.random() * 20 + 5).toFixed(1)} L`,
      idleTime: `${Math.floor(Math.random() * 60)} min`,
      status: Math.random() > 0.8 ? 'Alert' : 'Normal',
    }));
  }, []);

  const generateGeofenceReports = useCallback((vehicles: Vehicle[]): GeofenceReportData[] => {
    const geofenceNames = ['Warehouse A', 'Customer Site B', 'Depot C', 'Service Center D'];
    return vehicles.slice(0, 12).map((vehicle, index) => ({
      id: `geofence-${vehicle.deviceid}-${index}`,
      vehicleId: vehicle.deviceid,
      vehicleName: vehicle.devicename,
      geofenceName: geofenceNames[Math.floor(Math.random() * geofenceNames.length)],
      eventType: Math.random() > 0.5 ? 'enter' : 'exit' as 'enter' | 'exit',
      eventTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString(),
      duration: Math.random() > 0.5 ? `${Math.floor(Math.random() * 120 + 10)} min` : undefined,
      location: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.0060 + (Math.random() - 0.5) * 0.1,
      },
      status: Math.random() > 0.9 ? 'Violation' : 'Normal',
    }));
  }, []);

  const generateMaintenanceReports = useCallback((vehicles: Vehicle[]): MaintenanceReportData[] => {
    const maintenanceTypes = ['Oil Change', 'Tire Rotation', 'Brake Inspection', 'Engine Service', 'Transmission Check'];
    return vehicles.slice(0, 10).map((vehicle, index) => ({
      id: `maintenance-${vehicle.deviceid}-${index}`,
      vehicleId: vehicle.deviceid,
      vehicleName: vehicle.devicename,
      maintenanceType: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
      scheduledDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      completedDate: Math.random() > 0.6 ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toLocaleDateString() : undefined,
      cost: Math.random() > 0.3 ? `$${Math.floor(Math.random() * 500 + 100)}` : undefined,
      serviceProvider: Math.random() > 0.4 ? 'AutoService Pro' : 'Fleet Maintenance Inc',
      nextServiceDue: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: Math.random() > 0.7 ? 'overdue' : Math.random() > 0.4 ? 'completed' : 'scheduled',
    }));
  }, []);

  const generateAlertReports = useCallback((vehicles: Vehicle[]): AlertReportData[] => {
    const alertTypes = ['Speed Violation', 'Geofence Breach', 'Engine Warning', 'Low Fuel', 'Maintenance Due', 'Security Alert'];
    const severities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
    
    return vehicles.slice(0, 8).map((vehicle, index) => ({
      id: `alert-${vehicle.deviceid}-${index}`,
      vehicleId: vehicle.deviceid,
      vehicleName: vehicle.devicename,
      alertType: alertTypes[Math.floor(Math.random() * alertTypes.length)],
      alertTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString(),
      severity: severities[Math.floor(Math.random() * severities.length)],
      description: 'Alert description with details about the issue detected.',
      location: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.0060 + (Math.random() - 0.5) * 0.1,
      },
      acknowledgedBy: Math.random() > 0.5 ? 'Fleet Manager' : undefined,
      acknowledgedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toLocaleString() : undefined,
      status: Math.random() > 0.6 ? 'resolved' : Math.random() > 0.3 ? 'acknowledged' : 'active',
    }));
  }, []);

  const generateMileageReports = useCallback((vehicles: Vehicle[]): MileageReportData[] => {
    const periods = ['Daily', 'Weekly', 'Monthly'];
    return vehicles.slice(0, 12).map((vehicle, index) => ({
      id: `mileage-${vehicle.deviceid}-${index}`,
      vehicleId: vehicle.deviceid,
      vehicleName: vehicle.devicename,
      period: periods[Math.floor(Math.random() * periods.length)],
      totalDistance: `${Math.floor(Math.random() * 2000 + 500)} km`,
      averageDistance: `${Math.floor(Math.random() * 200 + 50)} km/day`,
      fuelConsumption: `${(Math.random() * 150 + 50).toFixed(1)} L`,
      fuelEfficiency: `${(Math.random() * 5 + 8).toFixed(1)} km/L`,
      costPerMile: `$${(Math.random() * 0.5 + 0.3).toFixed(2)}`,
      utilizationRate: `${Math.floor(Math.random() * 40 + 60)}%`,
    }));
  }, []);

  const generateReport = useCallback(async (vehicles: Vehicle[]) => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const filteredVehicles = filters.vehicleIds.length > 0 
      ? vehicles.filter(v => filters.vehicleIds.includes(v.deviceid))
      : vehicles;

    let data: ReportData[] = [];

    switch (filters.reportType) {
      case 'trip':
      case 'activity':
        data = generateTripReports(filteredVehicles);
        break;
      case 'geofence':
        data = generateGeofenceReports(filteredVehicles);
        break;
      case 'maintenance':
        data = generateMaintenanceReports(filteredVehicles);
        break;
      case 'alerts':
        data = generateAlertReports(filteredVehicles);
        break;
      case 'mileage':
        data = generateMileageReports(filteredVehicles);
        break;
      default:
        data = generateTripReports(filteredVehicles);
    }

    setReportData(data);
    setIsLoading(false);
  }, [filters, generateTripReports, generateGeofenceReports, generateMaintenanceReports, generateAlertReports, generateMileageReports]);

  const exportReport = useCallback((format: 'csv' | 'pdf' = 'csv') => {
    if (reportData.length === 0) return;

    if (format === 'csv') {
      let headers: string[] = [];
      let csvContent = '';

      switch (filters.reportType) {
        case 'trip':
        case 'activity':
          headers = ['Vehicle ID', 'Vehicle Name', 'Type', 'Start Time', 'End Time', 'Duration', 'Distance', 'Avg Speed', 'Max Speed', 'Fuel', 'Idle Time', 'Status'];
          csvContent = [
            headers.join(','),
            ...reportData.map(row => {
              const tripRow = row as TripReportData;
              return [
                tripRow.vehicleId,
                tripRow.vehicleName,
                tripRow.type,
                tripRow.startTime,
                tripRow.endTime,
                tripRow.duration,
                tripRow.distance,
                tripRow.averageSpeed,
                tripRow.maxSpeed,
                tripRow.fuelConsumption || '',
                tripRow.idleTime || '',
                tripRow.status
              ].join(',');
            })
          ].join('\n');
          break;

        case 'geofence':
          headers = ['Vehicle ID', 'Vehicle Name', 'Geofence', 'Event Type', 'Event Time', 'Duration', 'Location', 'Status'];
          csvContent = [
            headers.join(','),
            ...reportData.map(row => {
              const geoRow = row as GeofenceReportData;
              return [
                geoRow.vehicleId,
                geoRow.vehicleName,
                geoRow.geofenceName,
                geoRow.eventType,
                geoRow.eventTime,
                geoRow.duration || '',
                `${geoRow.location.lat}, ${geoRow.location.lng}`,
                geoRow.status
              ].join(',');
            })
          ].join('\n');
          break;

        case 'maintenance':
          headers = ['Vehicle ID', 'Vehicle Name', 'Maintenance Type', 'Scheduled Date', 'Completed Date', 'Cost', 'Service Provider', 'Next Service Due', 'Status'];
          csvContent = [
            headers.join(','),
            ...reportData.map(row => {
              const maintRow = row as MaintenanceReportData;
              return [
                maintRow.vehicleId,
                maintRow.vehicleName,
                maintRow.maintenanceType,
                maintRow.scheduledDate,
                maintRow.completedDate || '',
                maintRow.cost || '',
                maintRow.serviceProvider || '',
                maintRow.nextServiceDue || '',
                maintRow.status
              ].join(',');
            })
          ].join('\n');
          break;

        case 'alerts':
          headers = ['Vehicle ID', 'Vehicle Name', 'Alert Type', 'Alert Time', 'Severity', 'Description', 'Location', 'Acknowledged By', 'Acknowledged At', 'Status'];
          csvContent = [
            headers.join(','),
            ...reportData.map(row => {
              const alertRow = row as AlertReportData;
              return [
                alertRow.vehicleId,
                alertRow.vehicleName,
                alertRow.alertType,
                alertRow.alertTime,
                alertRow.severity,
                alertRow.description,
                alertRow.location ? `${alertRow.location.lat}, ${alertRow.location.lng}` : '',
                alertRow.acknowledgedBy || '',
                alertRow.acknowledgedAt || '',
                alertRow.status
              ].join(',');
            })
          ].join('\n');
          break;

        case 'mileage':
          headers = ['Vehicle ID', 'Vehicle Name', 'Period', 'Total Distance', 'Average Distance', 'Fuel Consumption', 'Fuel Efficiency', 'Cost Per Mile', 'Utilization Rate'];
          csvContent = [
            headers.join(','),
            ...reportData.map(row => {
              const mileageRow = row as MileageReportData;
              return [
                mileageRow.vehicleId,
                mileageRow.vehicleName,
                mileageRow.period,
                mileageRow.totalDistance,
                mileageRow.averageDistance,
                mileageRow.fuelConsumption,
                mileageRow.fuelEfficiency,
                mileageRow.costPerMile,
                mileageRow.utilizationRate
              ].join(',');
            })
          ].join('\n');
          break;
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filters.reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }, [reportData, filters.reportType]);

  const updateFilters = useCallback((newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const setActiveReportTab = useCallback((tab: ReportType) => {
    setActiveTab(tab);
    updateFilters({ reportType: tab });
  }, [updateFilters]);

  return {
    reportData,
    isLoading,
    activeTab,
    filters,
    generateReport,
    exportReport,
    updateFilters,
    setActiveReportTab,
  };
};
