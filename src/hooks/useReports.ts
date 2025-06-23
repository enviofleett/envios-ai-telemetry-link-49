
import { useState, useCallback } from 'react';
import type { VehicleData } from '@/services/unifiedVehicleData';

export type ReportType = 'trip' | 'activity' | 'maintenance' | 'alerts';

export interface ReportFilters {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  vehicleIds: string[];
  reportType: ReportType;
  status?: string;
}

export interface ReportData {
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
  status: string;
}

export const useReports = () => {
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
    return vehicles.slice(0, 10).map((vehicle, index) => ({
      id: `${type}-${vehicle.device_id}-${index}`,
      vehicleId: vehicle.device_id,
      vehicleName: vehicle.device_name,
      type: type === 'trip' ? 'Trip' : type === 'activity' ? 'Activity' : type === 'maintenance' ? 'Maintenance' : 'Alert',
      startTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString(),
      endTime: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toLocaleString(),
      duration: `${Math.floor(Math.random() * 8 + 1)}h ${Math.floor(Math.random() * 60)}m`,
      distance: `${Math.floor(Math.random() * 500 + 50)} km`,
      averageSpeed: `${Math.floor(Math.random() * 60 + 20)} km/h`,
      maxSpeed: `${Math.floor(Math.random() * 40 + 80)} km/h`,
      status: Math.random() > 0.8 ? 'Alert' : 'Normal',
    }));
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
      const headers = ['Vehicle ID', 'Vehicle Name', 'Type', 'Start Time', 'End Time', 'Duration', 'Distance', 'Avg Speed', 'Max Speed', 'Status'];
      const csvContent = [
        headers.join(','),
        ...reportData.map(row => [
          row.vehicleId,
          row.vehicleName,
          row.type,
          row.startTime,
          row.endTime,
          row.duration,
          row.distance,
          row.averageSpeed,
          row.maxSpeed,
          row.status
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
