
import { useState, useCallback } from 'react';
import type { VehicleData } from '@/types/vehicle';

export interface ReportFilters {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  vehicleIds: string[];
  status?: string;
}

export interface ReportData {
  id: string;
  type: string;
  generatedAt: Date;
  vehicleCount: number;
  status: 'pending' | 'completed' | 'error';
}

const useReports = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<ReportData[]>([]);

  const generateReport = useCallback(async (
    filters: ReportFilters,
    vehicles: VehicleData[]
  ) => {
    setIsLoading(true);

    try {
      // Filter vehicles
      let filteredVehicles = vehicles;
      
      if (filters.vehicleIds.length > 0) {
        filteredVehicles = vehicles.filter(vehicle => 
          filters.vehicleIds.includes(vehicle.device_id)
        );
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newReport: ReportData = {
        id: `report_${Date.now()}`,
        type: 'standard',
        generatedAt: new Date(),
        vehicleCount: filteredVehicles.length,
        status: 'completed'
      };

      setReports(prev => [newReport, ...prev]);

    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    reports,
    generateReport
  };
};

export default useReports;
