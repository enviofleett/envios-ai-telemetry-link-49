
import { useState, useCallback } from 'react';
import type { VehicleData } from '@/services/unifiedVehicleData';

export type ReportType = 'trip' | 'geofence' | 'mileage' | 'maintenance' | 'alerts' | 'activity';

export interface ReportFilters {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  vehicleIds: string[];
  reportType: ReportType;
  status?: string;
}

export interface TripReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  startTime: string;
  endTime: string;
  duration: string;
  distance: string;
  averageSpeed: string;
  maxSpeed: string;
  fuelConsumption: string;
  status: string;
}

export interface GeofenceReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  geofenceName: string;
  eventType: 'enter' | 'exit';
  eventTime: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
  duration?: string;
  status: string;
}

export interface MaintenanceReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  maintenanceType: string;
  scheduledDate: string;
  completedDate?: string;
  nextServiceDue: string;
  status: 'scheduled' | 'completed' | 'overdue';
  cost?: string;
  notes?: string;
}

export interface AlertReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  alertType: string;
  alertTime: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  description: string;
  acknowledgedBy?: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface MileageReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  period: string;
  date: string;
  totalDistance: string;
  averageDistance: string;
  dailyMileage: number;
  totalMileage: number;
  fuelConsumption: string;
  fuelEfficiency: string;
  efficiency: number;
  utilizationRate: string;
}

export type ReportData = TripReportData | GeofenceReportData | MaintenanceReportData | AlertReportData | MileageReportData;

export const useAdvancedReports = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [activeTab, setActiveTab] = useState<ReportType>('trip');
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      to: new Date(),
    },
    vehicleIds: [],
    reportType: 'trip',
  });

  const generateMockReportData = useCallback((vehicles: VehicleData[], type: ReportType): ReportData[] => {
    return vehicles.slice(0, 10).map((vehicle, index) => {
      switch (type) {
        case 'trip':
        case 'activity':
          return {
            id: `${type}-${vehicle.device_id}-${index}`,
            vehicleId: vehicle.device_id,
            vehicleName: vehicle.device_name,
            startTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString(),
            endTime: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toLocaleString(),
            duration: `${Math.floor(Math.random() * 8 + 1)}h ${Math.floor(Math.random() * 60)}m`,
            distance: `${Math.floor(Math.random() * 500 + 50)} km`,
            averageSpeed: `${Math.floor(Math.random() * 60 + 20)} km/h`,
            maxSpeed: `${Math.floor(Math.random() * 40 + 80)} km/h`,
            fuelConsumption: `${Math.floor(Math.random() * 30 + 10)} L`,
            status: Math.random() > 0.8 ? 'Alert' : 'Normal',
          } as TripReportData;
        
        case 'geofence':
          return {
            id: `geofence-${vehicle.device_id}-${index}`,
            vehicleId: vehicle.device_id,
            vehicleName: vehicle.device_name,
            geofenceName: `Zone ${index + 1}`,
            eventType: Math.random() > 0.5 ? 'enter' : 'exit',
            eventTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString(),
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            location: {
              lat: 40.7128 + (Math.random() - 0.5) * 0.1,
              lng: -74.0060 + (Math.random() - 0.5) * 0.1,
            },
            duration: `${Math.floor(Math.random() * 120 + 10)} minutes`,
            status: Math.random() > 0.7 ? 'Violation' : 'Normal'
          } as GeofenceReportData;

        case 'maintenance':
          return {
            id: `maintenance-${vehicle.device_id}-${index}`,
            vehicleId: vehicle.device_id,
            vehicleName: vehicle.device_name,
            maintenanceType: ['Oil Change', 'Brake Service', 'Tire Rotation', 'Battery Check'][Math.floor(Math.random() * 4)],
            scheduledDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            completedDate: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toLocaleDateString() : undefined,
            nextServiceDue: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            status: ['scheduled', 'completed', 'overdue'][Math.floor(Math.random() * 3)] as 'scheduled' | 'completed' | 'overdue',
            cost: `$${Math.floor(Math.random() * 500 + 100)}`,
          } as MaintenanceReportData;

        case 'alerts':
          return {
            id: `alert-${vehicle.device_id}-${index}`,
            vehicleId: vehicle.device_id,
            vehicleName: vehicle.device_name,
            alertType: ['Speed Violation', 'Harsh Braking', 'Unauthorized Use', 'Engine Warning'][Math.floor(Math.random() * 4)],
            alertTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString(),
            severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical',
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            description: `Alert detected for vehicle ${vehicle.device_name}`,
            acknowledgedBy: Math.random() > 0.5 ? 'Admin User' : undefined,
            status: ['active', 'acknowledged', 'resolved'][Math.floor(Math.random() * 3)] as 'active' | 'acknowledged' | 'resolved',
          } as AlertReportData;

        case 'mileage':
          return {
            id: `mileage-${vehicle.device_id}-${index}`,
            vehicleId: vehicle.device_id,
            vehicleName: vehicle.device_name,
            period: 'Daily',
            date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString(),
            totalDistance: `${Math.floor(Math.random() * 200 + 50)} km`,
            averageDistance: `${Math.floor(Math.random() * 50 + 20)} km`,
            dailyMileage: Math.floor(Math.random() * 200 + 50),
            totalMileage: Math.floor(Math.random() * 10000 + 5000),
            fuelConsumption: `${Math.floor(Math.random() * 30 + 10)} L`,
            fuelEfficiency: `${(Math.random() * 5 + 8).toFixed(1)} km/L`,
            efficiency: Math.random() * 5 + 8,
            utilizationRate: `${Math.floor(Math.random() * 40 + 60)}%`,
          } as MileageReportData;
        
        default:
          return {
            id: `${type}-${vehicle.device_id}-${index}`,
            vehicleId: vehicle.device_id,
            vehicleName: vehicle.device_name,
            status: 'Normal'
          } as any;
      }
    });
  }, []);

  const generateReport = useCallback(async (vehicles: VehicleData[]) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const filteredVehicles = filters.vehicleIds.length > 0 
      ? vehicles.filter(v => filters.vehicleIds.includes(v.device_id))
      : vehicles;

    const data = generateMockReportData(filteredVehicles, filters.reportType);
    setReportData(data);
    setIsLoading(false);
  }, [filters, generateMockReportData]);

  const exportReport = useCallback((format: 'csv' | 'pdf' = 'csv') => {
    if (reportData.length === 0) return;

    if (format === 'csv') {
      const headers = ['Vehicle ID', 'Vehicle Name', 'Type', 'Status'];
      const csvContent = [
        headers.join(','),
        ...reportData.map(row => [
          row.vehicleId,
          row.vehicleName,
          filters.reportType,
          'status' in row ? row.status : 'N/A'
        ].join(','))
      ].join('\n');

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
