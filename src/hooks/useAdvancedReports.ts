import { useState, useCallback } from 'react';
import type { VehicleData } from '@/services/unifiedVehicleData';

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

  const generateReport = useCallback(async (vehicles: VehicleData[]) => {
    setIsLoading(true);
    
    try {
      const query: ReportQuery = {
        vehicleIds: filters.vehicleIds.length > 0 ? filters.vehicleIds : undefined,
        dateFrom: filters.dateRange.from || undefined,
        dateTo: filters.dateRange.to || undefined,
        reportType: filters.reportType,
        status: filters.status,
        limit: 50
      };

      let apiData: any[] = [];

      switch (filters.reportType) {
        case 'trip':
        case 'activity':
          apiData = await reportsApi.generateTripReports(query);
          break;
        case 'geofence':
          apiData = await reportsApi.generateGeofenceReports(query);
          break;
        case 'maintenance':
          apiData = await reportsApi.generateMaintenanceReports(query);
          break;
        case 'alerts':
          apiData = await reportsApi.generateAlertReports(query);
          break;
        case 'mileage':
          // Use existing mock data for mileage reports
          apiData = generateMileageReports(vehicles);
          break;
        default:
          apiData = await reportsApi.generateTripReports(query);
      }

      // Transform API data to match the existing interface
      const transformedData = transformApiDataToReportData(apiData, filters.reportType);
      setReportData(transformedData);
      
    } catch (error) {
      console.error('Error generating report:', error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const transformApiDataToReportData = (apiData: any[], reportType: ReportType): ReportData[] => {
    switch (reportType) {
      case 'trip':
      case 'activity':
        return apiData.map(trip => ({
          id: trip.id,
          vehicleId: trip.vehicleId,
          vehicleName: trip.vehicleName,
          type: 'Trip',
          startTime: new Date(trip.startTime).toLocaleString(),
          endTime: new Date(trip.endTime).toLocaleString(),
          duration: `${Math.floor(trip.duration / 60)}h ${trip.duration % 60}m`,
          distance: `${(trip.distance / 1000).toFixed(1)} km`,
          averageSpeed: `${trip.averageSpeed} km/h`,
          maxSpeed: `${trip.maxSpeed} km/h`,
          fuelConsumption: trip.fuelConsumed ? `${trip.fuelConsumed} L` : '',
          idleTime: trip.idleTime ? `${trip.idleTime} min` : '',
          status: trip.status === 'completed' ? 'Normal' : 'Alert',
        }));

      case 'geofence':
        return apiData.map(geo => ({
          id: geo.id,
          vehicleId: geo.vehicleId,
          vehicleName: geo.vehicleName,
          geofenceName: geo.geofenceName,
          eventType: geo.eventType,
          eventTime: new Date(geo.eventTime).toLocaleString(),
          duration: geo.duration ? `${geo.duration} min` : '',
          location: geo.location,
          status: geo.violationType === 'unauthorized' ? 'Violation' : 'Normal',
        }));

      case 'maintenance':
        return apiData.map(maint => ({
          id: maint.id,
          vehicleId: maint.vehicleId,
          vehicleName: maint.vehicleName,
          maintenanceType: maint.maintenanceType,
          scheduledDate: new Date(maint.scheduledDate).toLocaleDateString(),
          completedDate: maint.completedDate ? new Date(maint.completedDate).toLocaleDateString() : undefined,
          cost: maint.cost ? `$${maint.cost}` : undefined,
          serviceProvider: maint.serviceProvider,
          nextServiceDue: maint.nextServiceDue ? new Date(maint.nextServiceDue).toLocaleDateString() : undefined,
          status: maint.status,
        }));

      case 'alerts':
        return apiData.map(alert => ({
          id: alert.id,
          vehicleId: alert.vehicleId,
          vehicleName: alert.vehicleName,
          alertType: alert.alertType,
          alertTime: new Date(alert.alertTime).toLocaleString(),
          severity: alert.severity,
          description: alert.description,
          location: alert.location,
          acknowledgedBy: alert.resolvedBy,
          acknowledgedAt: alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : undefined,
          status: alert.status,
        }));

      default:
        return [];
    }
  };

  const generateMileageReports = useCallback((vehicles: VehicleData[]): MileageReportData[] => {
    const periods = ['Daily', 'Weekly', 'Monthly'];
    const filteredVehicles = filters.vehicleIds.length > 0 
      ? vehicles.filter(v => filters.vehicleIds.includes(v.deviceid))
      : vehicles;

    return filteredVehicles.slice(0, 12).map((vehicle, index) => ({
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
  }, [filters.vehicleIds]);

  const exportReport = useCallback(async (format: 'csv' | 'pdf' = 'csv') => {
    if (reportData.length === 0) return;

    if (format === 'csv') {
      try {
        const csvContent = await reportsApi.exportReportData(filters.reportType, reportData);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filters.reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error exporting report:', error);
      }
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
