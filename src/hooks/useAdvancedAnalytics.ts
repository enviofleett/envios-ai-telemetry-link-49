
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdvancedAnalyticsData {
  fleetAnalytics: {
    totalVehicles: number;
    activeVehicles: number;
    inactiveVehicles: number;
    averageSpeed: number;
    totalDistance: number;
    fuelEfficiency: number;
  };
  vehiclePerformance: {
    topPerformers: Array<{
      deviceId: string;
      deviceName: string;
      score: number;
      metrics: {
        uptime: number;
        efficiency: number;
        alerts: number;
      };
    }>;
    averagePerformance: number;
  };
  trendData: {
    daily: Array<{
      date: string;
      activeVehicles: number;
      totalDistance: number;
      alerts: number;
    }>;
    weekly: Array<{
      week: string;
      metrics: {
        utilization: number;
        efficiency: number;
        incidents: number;
      };
    }>;
  };
}

export interface UseAdvancedAnalyticsReturn {
  data: AdvancedAnalyticsData;
  isLoading: boolean;
  error: string;
  refreshData: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  generateReport: () => Promise<void>;
}

export function useAdvancedAnalytics(): UseAdvancedAnalyticsReturn {
  const [data, setData] = useState<AdvancedAnalyticsData>({
    fleetAnalytics: {
      totalVehicles: 0,
      activeVehicles: 0,
      inactiveVehicles: 0,
      averageSpeed: 0,
      totalDistance: 0,
      fuelEfficiency: 0
    },
    vehiclePerformance: {
      topPerformers: [],
      averagePerformance: 0
    },
    trendData: {
      daily: [],
      weekly: []
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFleetAnalytics = useCallback(async () => {
    try {
      const { data: devices, error: devicesError } = await supabase
        .from('gp51_devices')
        .select('device_id, device_name, is_online, status')
        .eq('status', 'active');

      if (devicesError) throw devicesError;

      const { data: positions, error: positionsError } = await supabase
        .from('gp51_positions')
        .select('device_id, speed, latitude, longitude, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (positionsError) throw positionsError;

      const totalVehicles = devices?.length || 0;
      const activeVehicles = devices?.filter(d => d.is_online).length || 0;
      const inactiveVehicles = totalVehicles - activeVehicles;

      const speeds = positions?.map(p => p.speed || 0) || [];
      const averageSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

      return {
        totalVehicles,
        activeVehicles,
        inactiveVehicles,
        averageSpeed: Math.round(averageSpeed * 100) / 100,
        totalDistance: 0, // Placeholder - would need calculation
        fuelEfficiency: 0 // Placeholder - would need fuel data
      };
    } catch (err) {
      console.error('Error fetching fleet analytics:', err);
      throw err;
    }
  }, []);

  const fetchVehiclePerformance = useCallback(async () => {
    try {
      const { data: devices, error } = await supabase
        .from('gp51_devices')
        .select('device_id, device_name, is_online')
        .eq('status', 'active')
        .limit(10);

      if (error) throw error;

      const topPerformers = (devices || []).map(device => ({
        deviceId: device.device_id,
        deviceName: device.device_name,
        score: Math.random() * 100, // Mock score
        metrics: {
          uptime: Math.random() * 100,
          efficiency: Math.random() * 100,
          alerts: Math.floor(Math.random() * 10)
        }
      }));

      return {
        topPerformers,
        averagePerformance: topPerformers.reduce((sum, p) => sum + p.score, 0) / topPerformers.length || 0
      };
    } catch (err) {
      console.error('Error fetching vehicle performance:', err);
      throw err;
    }
  }, []);

  const fetchTrendData = useCallback(async () => {
    try {
      // Generate mock trend data for the last 7 days
      const daily = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          activeVehicles: Math.floor(Math.random() * 50) + 10,
          totalDistance: Math.floor(Math.random() * 1000) + 100,
          alerts: Math.floor(Math.random() * 20)
        };
      }).reverse();

      // Generate mock weekly data
      const weekly = Array.from({ length: 4 }, (_, i) => ({
        week: `Week ${i + 1}`,
        metrics: {
          utilization: Math.random() * 100,
          efficiency: Math.random() * 100,
          incidents: Math.floor(Math.random() * 5)
        }
      }));

      return { daily, weekly };
    } catch (err) {
      console.error('Error fetching trend data:', err);
      throw err;
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [fleetAnalytics, vehiclePerformance, trendData] = await Promise.all([
        fetchFleetAnalytics(),
        fetchVehiclePerformance(),
        fetchTrendData()
      ]);

      setData({
        fleetAnalytics,
        vehiclePerformance,
        trendData
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics data';
      setError(errorMessage);
      console.error('Error refreshing analytics data:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFleetAnalytics, fetchVehiclePerformance, fetchTrendData]);

  const refreshAnalytics = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  const generateReport = useCallback(async () => {
    console.log('Generating analytics report...');
    // Implementation would generate and download report
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    data,
    isLoading,
    error,
    refreshData,
    refreshAnalytics,
    generateReport
  };
}
