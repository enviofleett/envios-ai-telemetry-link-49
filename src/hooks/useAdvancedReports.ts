import { useState, useCallback } from 'react';
import type { VehicleData } from '@/types/vehicle';

export interface AdvancedReportFilters {
  reportType: string;
  vehicleFilter: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  statusFilter: string;
}

export interface AdvancedReportData {
  id: string;
  reportType: string;
  generatedAt: Date;
  vehicleCount: number;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  status: 'pending' | 'completed' | 'error';
  downloadUrl?: string;
  size?: string;
}

export interface TripReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  startTime: Date;
  endTime: Date;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: number;
  averageSpeed: number;
  maxSpeed: number;
  status: 'completed' | 'ongoing' | 'interrupted';
}

export interface GeofenceReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  geofenceName: string;
  entryTime: Date;
  exitTime: Date | null;
  duration: number | null;
  status: 'inside' | 'outside';
}

export interface MaintenanceReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  maintenanceType: string;
  scheduledDate: Date;
  completedDate: Date | null;
  status: 'scheduled' | 'completed' | 'overdue';
  notes: string;
}

export interface AlertReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  alertType: string;
  timestamp: Date;
  location: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export interface MileageReportData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  date: Date;
  distance: number;
  fuelUsed: number;
  efficiency: number;
  cost: number;
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
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
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
      // Filter vehicles based on criteria
      let filteredVehicles = vehicles;

      if (filters.vehicleIds.length > 0) {
        filteredVehicles = vehicles.filter(vehicle => 
          filters.vehicleIds.includes(vehicle.device_id)
        );
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate mock data based on report type
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
    console.log(`Exporting report in ${format} format`, {
      data: reportData,
      filters,
      activeTab
    });
    
    // Simulate download
    setTimeout(() => {
      alert(`Report exported as ${format.toUpperCase()}`);
    }, 500);
  }, [reportData, filters, activeTab]);

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

// Helper functions to generate mock data
const generateMockTripData = (vehicles: VehicleData[]): TripReportData[] => {
  const trips: TripReportData[] = [];
  
  vehicles.forEach(vehicle => {
    // Generate 1-3 random trips per vehicle
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
        startTime,
        endTime,
        startLocation: `Location A-${Math.floor(Math.random() * 10)}`,
        endLocation: `Location B-${Math.floor(Math.random() * 10)}`,
        distance,
        duration: durationHours * 60, // in minutes
        averageSpeed: avgSpeed,
        maxSpeed: avgSpeed + Math.round(Math.random() * 30),
        status: Math.random() > 0.8 ? 'interrupted' : 'completed'
      });
    }
  });
  
  return trips;
};

const generateMockGeofenceData = (vehicles: VehicleData[]): GeofenceReportData[] => {
  const geofenceData: GeofenceReportData[] = [];
  const geofenceNames = ['Office', 'Warehouse', 'Customer Site', 'Depot', 'Restricted Area'];
  
  vehicles.forEach(vehicle => {
    // Generate 1-4 geofence events per vehicle
    const eventCount = Math.floor(Math.random() * 4) + 1;
    
    for (let i = 0; i < eventCount; i++) {
      const entryTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const isStillInside = Math.random() > 0.7;
      const durationHours = isStillInside ? null : Math.random() * 3 + 0.2;
      const exitTime = isStillInside ? null : new Date(entryTime.getTime() + (durationHours || 0) * 60 * 60 * 1000);
      
      geofenceData.push({
        id: `geofence_${vehicle.device_id}_${i}`,
        vehicleId: vehicle.device_id,
        vehicleName: vehicle.device_name,
        geofenceName: geofenceNames[Math.floor(Math.random() * geofenceNames.length)],
        entryTime,
        exitTime,
        duration: durationHours ? durationHours * 60 : null, // in minutes
        status: isStillInside ? 'inside' : 'outside'
      });
    }
  });
  
  return geofenceData;
};

const generateMockMaintenanceData = (vehicles: VehicleData[]): MaintenanceReportData[] => {
  const maintenanceData: MaintenanceReportData[] = [];
  const maintenanceTypes = ['Oil Change', 'Tire Rotation', 'Brake Inspection', 'Full Service', 'Battery Check'];
  
  vehicles.forEach(vehicle => {
    // Generate 1-3 maintenance records per vehicle
    const recordCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < recordCount; i++) {
      const scheduledDate = new Date(Date.now() + (Math.random() * 30 - 15) * 24 * 60 * 60 * 1000);
      const status = scheduledDate < new Date() ? 
        (Math.random() > 0.5 ? 'completed' : 'overdue') : 
        'scheduled';
      const completedDate = status === 'completed' ? 
        new Date(scheduledDate.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000) : 
        null;
      
      maintenanceData.push({
        id: `maintenance_${vehicle.device_id}_${i}`,
        vehicleId: vehicle.device_id,
        vehicleName: vehicle.device_name,
        maintenanceType: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
        scheduledDate,
        completedDate,
        status,
        notes: status === 'overdue' ? 'Requires immediate attention' : ''
      });
    }
  });
  
  return maintenanceData;
};

const generateMockAlertData = (vehicles: VehicleData[]): AlertReportData[] => {
  const alertData: AlertReportData[] = [];
  const alertTypes = ['Speed Limit', 'Geofence Breach', 'Engine Warning', 'Low Fuel', 'Unauthorized Access'];
  const severities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  
  vehicles.forEach(vehicle => {
    // Generate 0-5 alerts per vehicle
    const alertCount = Math.floor(Math.random() * 6);
    
    for (let i = 0; i < alertCount; i++) {
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      alertData.push({
        id: `alert_${vehicle.device_id}_${i}`,
        vehicleId: vehicle.device_id,
        vehicleName: vehicle.device_name,
        alertType,
        timestamp,
        location: `${(Math.random() * 90).toFixed(6)}, ${(Math.random() * 180).toFixed(6)}`,
        message: `${alertType} alert triggered`,
        severity,
        resolved: Math.random() > 0.3
      });
    }
  });
  
  return alertData;
};

const generateMockMileageData = (vehicles: VehicleData[]): MileageReportData[] => {
  const mileageData: MileageReportData[] = [];
  
  vehicles.forEach(vehicle => {
    // Generate 7 days of mileage data
    for (let i = 0; i < 7; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const distance = Math.round(Math.random() * 150 + 10);
      const fuelUsed = +(distance / (Math.random() * 5 + 8)).toFixed(2);
      const efficiency = +(distance / fuelUsed).toFixed(2);
      
      mileageData.push({
        id: `mileage_${vehicle.device_id}_${i}`,
        vehicleId: vehicle.device_id,
        vehicleName: vehicle.device_name,
        date,
        distance,
        fuelUsed,
        efficiency,
        cost: +(fuelUsed * (Math.random() * 0.5 + 1.5)).toFixed(2) // Fuel price between $1.50-$2.00
      });
    }
  });
  
  return mileageData;
};

export default useAdvancedReports;
