
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FleetMetrics {
  totalVehicles: number;
  activeVehicles: number;
  totalDistance: number;
  averageSpeed: number;
  fuelConsumption: number;
  maintenanceAlerts: number;
}

export interface VehiclePerformance {
  deviceId: string;
  deviceName: string;
  totalDistance: number;
  averageSpeed: number;
  fuelEfficiency: number;
  uptime: number;
  alertCount: number;
}

export interface TrendData {
  date: string;
  value: number;
  metric: string;
}

export interface AdvancedAnalyticsData {
  fleetMetrics: FleetMetrics;
  vehiclePerformance: VehiclePerformance[];
  trends: {
    distance: TrendData[];
    speed: TrendData[];
    fuel: TrendData[];
    alerts: TrendData[];
  };
  realTimeStats: {
    activeVehicles: number;
    totalAlerts: number;
    averageSpeed: number;
    lastUpdated: Date;
  };
}

export function useAdvancedAnalytics() {
  const [data, setData] = useState<AdvancedAnalyticsData>({
    fleetMetrics: {
      totalVehicles: 0,
      activeVehicles: 0,
      totalDistance: 0,
      averageSpeed: 0,
      fuelConsumption: 0,
      maintenanceAlerts: 0
    },
    vehiclePerformance: [],
    trends: {
      distance: [],
      speed: [],
      fuel: [],
      alerts: []
    },
    realTimeStats: {
      activeVehicles: 0,
      totalAlerts: 0,
      averageSpeed: 0,
      lastUpdated: new Date()
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateFleetMetrics = useCallback(async (): Promise<FleetMetrics> => {
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('gp51_devices')
      .select('*');

    if (vehiclesError) throw vehiclesError;

    const { data: positions, error: positionsError } = await supabase
      .from('gp51_positions')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (positionsError) throw positionsError;

    const totalVehicles = vehicles?.length || 0;
    const activeVehicles = vehicles?.filter(v => v.is_active)?.length || 0;
    
    // Calculate metrics from available position data
    const totalDistance = positions?.reduce((sum, pos) => sum + (pos.total_distance || 0), 0) || 0;
    const averageSpeed = positions?.length 
      ? positions.reduce((sum, pos) => sum + (pos.speed || 0), 0) / positions.length 
      : 0;

    return {
      totalVehicles,
      activeVehicles,
      totalDistance,
      averageSpeed,
      fuelConsumption: 0, // Placeholder - would need fuel data
      maintenanceAlerts: 0 // Placeholder - would need maintenance data
    };
  }, []);

  const calculateVehiclePerformance = useCallback(async (): Promise<VehiclePerformance[]> => {
    const { data: positions, error } = await supabase
      .from('gp51_positions')
      .select(`
        *,
        gp51_devices!inner(*)
      `)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const vehicleMap = new Map<string, {
      deviceId: string;
      deviceName: string;
      positions: any[];
    }>();

    positions?.forEach(pos => {
      const deviceId = pos.device_id;
      if (!vehicleMap.has(deviceId)) {
        vehicleMap.set(deviceId, {
          deviceId,
          deviceName: pos.gp51_devices?.device_name || deviceId,
          positions: []
        });
      }
      vehicleMap.get(deviceId)?.positions.push(pos);
    });

    return Array.from(vehicleMap.values()).map(vehicle => {
      const totalDistance = vehicle.positions.reduce((sum, pos) => sum + (pos.total_distance || 0), 0);
      const averageSpeed = vehicle.positions.length 
        ? vehicle.positions.reduce((sum, pos) => sum + (pos.speed || 0), 0) / vehicle.positions.length 
        : 0;

      return {
        deviceId: vehicle.deviceId,
        deviceName: vehicle.deviceName,
        totalDistance,
        averageSpeed,
        fuelEfficiency: 0, // Placeholder
        uptime: 85, // Placeholder percentage
        alertCount: vehicle.positions.filter(pos => pos.alarm_code > 0).length
      };
    });
  }, []);

  const calculateTrends = useCallback(async () => {
    const { data: positions, error } = await supabase
      .from('gp51_positions')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const dailyData = new Map<string, {
      totalDistance: number;
      totalSpeed: number;
      speedCount: number;
      alertCount: number;
    }>();

    positions?.forEach(pos => {
      const date = new Date(pos.created_at).toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          totalDistance: 0,
          totalSpeed: 0,
          speedCount: 0,
          alertCount: 0
        });
      }
      
      const dayData = dailyData.get(date)!;
      dayData.totalDistance += pos.total_distance || 0;
      dayData.totalSpeed += pos.speed || 0;
      dayData.speedCount += 1;
      if (pos.alarm_code > 0) dayData.alertCount += 1;
    });

    return {
      distance: Array.from(dailyData.entries()).map(([date, data]) => ({
        date,
        value: data.totalDistance,
        metric: 'distance'
      })),
      speed: Array.from(dailyData.entries()).map(([date, data]) => ({
        date,
        value: data.speedCount > 0 ? data.totalSpeed / data.speedCount : 0,
        metric: 'speed'
      })),
      fuel: Array.from(dailyData.entries()).map(([date]) => ({
        date,
        value: Math.random() * 100, // Placeholder data
        metric: 'fuel'
      })),
      alerts: Array.from(dailyData.entries()).map(([date, data]) => ({
        date,
        value: data.alertCount,
        metric: 'alerts'
      }))
    };
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [fleetMetrics, vehiclePerformance, trends] = await Promise.all([
        calculateFleetMetrics(),
        calculateVehiclePerformance(),
        calculateTrends()
      ]);

      setData({
        fleetMetrics,
        vehiclePerformance,
        trends,
        realTimeStats: {
          activeVehicles: fleetMetrics.activeVehicles,
          totalAlerts: vehiclePerformance.reduce((sum, v) => sum + v.alertCount, 0),
          averageSpeed: fleetMetrics.averageSpeed,
          lastUpdated: new Date()
        }
      });
    } catch (err) {
      console.error('Error refreshing analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [calculateFleetMetrics, calculateVehiclePerformance, calculateTrends]);

  useEffect(() => {
    refreshData();
    
    // Set up periodic refresh every 5 minutes
    const interval = setInterval(refreshData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    data,
    isLoading,
    error,
    refreshData
  };
}
