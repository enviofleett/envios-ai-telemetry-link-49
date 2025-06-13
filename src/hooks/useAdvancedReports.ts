import { useState, useCallback } from 'react';
import type { VehicleData } from '@/types/vehicle';

export interface AdvancedReportFilters {
  reportType: string;
  vehicleFilter: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  statusFilter: string;
}

export interface TripReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  startTime: string;
  endTime: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: string;
  averageSpeed: string;
  maxSpeed: number;
  status: 'completed' | 'ongoing' | 'interrupted';
  fuelConsumption: string;
}

export interface GeofenceReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  geofenceName: string;
  entryTime: string;
  exitTime: string | null;
  duration: number | null;
  status: 'inside' | 'outside';
  eventType: string;
  eventTime: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface MaintenanceReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  maintenanceType: string;
  scheduledDate: string;
  completedDate: string | null;
  status: 'scheduled' | 'completed' | 'overdue';
  notes: string;
  cost: string;
  nextServiceDue: string;
}

export interface AlertReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  alertType: string;
  timestamp: string;
  location: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  alertTime: string;
  description: string;
  acknowledgedBy: string;
  status: string;
}

export interface MileageReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  date: string;
  distance: number;
  fuelUsed: number;
  efficiency: number;
  cost: number;
  period: string;
  totalDistance: string;
  averageDistance: string;
  fuelConsumption: string;
  fuelEfficiency: string;
  utilizationRate: string;
}

export type ReportData = 
  | TripReportData 
  | GeofenceReportData 
  | MaintenanceReportData 
  | AlertReportData 
  | MileageReportData;

export interface ReportFilters {
  reportType: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  vehicleIds: string[];
  status?: string;
}

export const useAdvancedReports = () => {
  const [activeTab, setActiveTab] = useState<string>('trip');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'activity',
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
    vehicleIds: [],
    status: 'all',
  });

  const updateFilters = useCallback((newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const setActiveReportTab = useCallback((tab: string) => {
    setActiveTab(tab);
    updateFilters({ reportType: tab });
  }, [updateFilters]);

  const generateReport = useCallback(async (vehicles: VehicleData[]) => {
    setIsLoading(true);
    setReportData([]);

    try {
      let filteredVehicles = vehicles;

      if (filters.vehicleIds.length > 0) {
        filteredVehicles = vehicles.filter(vehicle => 
          filters.vehicleIds.includes(vehicle.device_id)
        );
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      let mockData: ReportData[] = [];

      switch (activeTab) {
        case 'trip':
        case 'activity':
          mockData = generateMockTripData(filteredVehicles);
          break;
        case 'geofence':
          mockData = generateMockGeofenceData(filteredVehicles);
          break;
        case 'maintenance':
          mockData = generateMockMaintenanceData(filteredVehicles);
          break;
        case 'alerts':
          mockData = generateMockAlertData(filteredVehicles);
          break;
        case 'mileage':
          mockData = generateMockMileageData(filteredVehicles);
          break;
        default:
          mockData = generateMockTripData(filteredVehicles);
      }

      setReportData(mockData);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, filters]);

  const exportReport = useCallback((format: 'csv' | 'pdf' | 'excel') => {
    console.log(`Exporting report in ${format} format`);
  }, []);

  return {
    activeTab,
    reportData,
    isLoading,
    filters,
    generateReport,
    exportReport,
    updateFilters,
    setActiveReportTab,
  };
};

const generateMockTripData = (vehicles: VehicleData[]): TripReportData[] => {
  const trips: TripReportData[] = [];
  
  vehicles.forEach(vehicle => {
    const tripCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < tripCount; i++) {
      const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const durationHours = Math.random() * 5 + 0.5;
      const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
      const distance = Math.round(Math.random() * 100 + 5);
      const avgSpeed = Math.round(distance / durationHours);
      
      trips.push({
        id: `trip_${vehicle.device_id}_${i}`,
        vehicleId: vehicle.device_id,
        vehicleName: vehicle.device_name,
        startTime: startTime.toLocaleString(),
        endTime: endTime.toLocaleString(),
        startLocation: `Location A-${Math.floor(Math.random() * 10)}`,
        endLocation: `Location B-${Math.floor(Math.random() * 10)}`,
        distance,
        duration: `${Math.floor(durationHours)}h ${Math.floor((durationHours % 1) * 60)}m`,
        averageSpeed: `${avgSpeed} km/h`,
        maxSpeed: avgSpeed + Math.round(Math.random() * 30),
        status: Math.random() > 0.8 ? 'interrupted' : 'completed',
        fuelConsumption: `${(distance / (Math.random() * 5 + 8)).toFixed(1)} L`
      });
    }
  });
  
  return trips;
};

const generateMockGeofenceData = (vehicles: VehicleData[]): GeofenceReportData[] => {
  return [];
};

const generateMockMaintenanceData = (vehicles: VehicleData[]): MaintenanceReportData[] => {
  return [];
};

const generateMockAlertData = (vehicles: VehicleData[]): AlertReportData[] => {
  return [];
};

const generateMockMileageData = (vehicles: VehicleData[]): MileageReportData[] => {
  return [];
};

export default useAdvancedReports;
