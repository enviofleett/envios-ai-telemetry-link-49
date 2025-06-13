
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
  vehicleId: string;
  vehicleName: string;
  startTime: string;
  endTime: string;
  duration: string;
  distance: string;
  averageSpeed: string;
  fuelConsumption: string;
}

const useReports = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [activeTab, setActiveTab] = useState('trip');
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
    vehicleIds: [],
    status: 'all',
  });

  const generateReport = useCallback(async (
    filterParams: ReportFilters,
    vehicles: VehicleData[]
  ) => {
    setIsLoading(true);

    try {
      // Filter vehicles
      let filteredVehicles = vehicles;
      
      if (filterParams.vehicleIds.length > 0) {
        filteredVehicles = vehicles.filter(vehicle => 
          filterParams.vehicleIds.includes(vehicle.device_id)
        );
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockReportData: ReportData[] = filteredVehicles.map((vehicle, index) => ({
        id: `report_${vehicle.device_id}_${index}`,
        type: 'trip',
        generatedAt: new Date(),
        vehicleCount: 1,
        status: 'completed' as const,
        vehicleId: vehicle.device_id,
        vehicleName: vehicle.device_name,
        startTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString(),
        endTime: new Date().toLocaleString(),
        duration: `${Math.floor(Math.random() * 8 + 1)}h ${Math.floor(Math.random() * 60)}m`,
        distance: `${Math.floor(Math.random() * 200 + 50)} km`,
        averageSpeed: `${Math.floor(Math.random() * 40 + 30)} km/h`,
        fuelConsumption: `${(Math.random() * 20 + 10).toFixed(1)} L`
      }));

      setReports(mockReportData);

    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateFilters = useCallback((newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const setActiveReportTab = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const exportReport = useCallback((format: 'csv' | 'pdf' | 'excel') => {
    console.log(`Exporting report in ${format} format`);
  }, []);

  return {
    isLoading,
    reports,
    activeTab,
    filters,
    reportData: reports,
    generateReport,
    updateFilters,
    setActiveReportTab,
    exportReport
  };
};

export { useReports };
export default useReports;
