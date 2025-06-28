
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FleetAnalytics {
  totalVehicles: number;
  activeVehicles: number;
  movingVehicles: number;
  idleVehicles: number;
  offlineVehicles: number;
  totalDistance: number;
  averageSpeed: number;
  fuelEfficiency: number;
  alertsCount: number;
  performanceScore: number;
}

export interface VehiclePerformance {
  deviceId: string;
  deviceName: string;
  efficiency: number;
  utilizationRate: number;
  maintenanceScore: number;
  safetyScore: number;
  totalDistance: number;
  averageSpeed: number;
  idlePercentage: number;
  alertsCount: number;
}

export interface TrendData {
  date: string;
  totalDistance: number;
  averageSpeed: number;
  activeVehicles: number;
  fuelConsumption: number;
  efficiency: number;
}

export interface UseAdvancedAnalyticsReturn {
  fleetAnalytics: FleetAnalytics | null;
  vehiclePerformance: VehiclePerformance[];
  trendData: TrendData[];
  isLoading: boolean;
  error: string | null;
  refreshAnalytics: () => Promise<void>;
  getVehicleInsights: (deviceId: string) => Promise<any>;
  generateReport: (timeRange: string) => Promise<any>;
}

const defaultFleetAnalytics: FleetAnalytics = {
  totalVehicles: 0,
  activeVehicles: 0,
  movingVehicles: 0,
  idleVehicles: 0,
  offlineVehicles: 0,
  totalDistance: 0,
  averageSpeed: 0,
  fuelEfficiency: 0,
  alertsCount: 0,
  performanceScore: 0
};

export function useAdvancedAnalytics(): UseAdvancedAnalyticsReturn {
  const [fleetAnalytics, setFleetAnalytics] = useState<FleetAnalytics | null>(null);
  const [vehiclePerformance, setVehiclePerformance] = useState<VehiclePerformance[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateFleetAnalytics = useCallback(async (): Promise<FleetAnalytics> => {
    const { data: devices, error: devicesError } = await supabase
      .from('gp51_devices')
      .select('*');

    if (devicesError) throw devicesError;

    const { data: positions, error: positionsError } = await supabase
      .from('live_positions')
      .select('*');

    if (positionsError) throw positionsError;

    const totalVehicles = devices?.length || 0;
    let activeVehicles = 0;
    let movingVehicles = 0;
    let idleVehicles = 0;
    let offlineVehicles = 0;
    let totalDistance = 0;
    let totalSpeed = 0;
    let speedCount = 0;

    devices?.forEach(device => {
      const position = positions?.find(p => p.device_id === device.device_id);
      
      if (device.is_online) {
        activeVehicles++;
        
        if (position?.is_moving) {
          movingVehicles++;
        } else {
          idleVehicles++;
        }
        
        if (position?.total_distance) {
          totalDistance += position.total_distance;
        }
        
        if (position?.speed && position.speed > 0) {
          totalSpeed += position.speed;
          speedCount++;
        }
      } else {
        offlineVehicles++;
      }
    });

    const averageSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;
    const performanceScore = Math.min(100, (activeVehicles / totalVehicles) * 100);

    return {
      totalVehicles,
      activeVehicles,
      movingVehicles,
      idleVehicles,
      offlineVehicles,
      totalDistance,
      averageSpeed,
      fuelEfficiency: 85 + Math.random() * 10, // Mock calculation
      alertsCount: Math.floor(Math.random() * 5),
      performanceScore
    };
  }, []);

  const calculateVehiclePerformance = useCallback(async (): Promise<VehiclePerformance[]> => {
    const { data: positions, error } = await supabase
      .from('live_positions')
      .select(`
        *,
        gp51_devices!inner(device_name, is_online)
      `);

    if (error) throw error;

    return (positions || []).map(position => {
      const device = position.gp51_devices;
      const totalTime = (position.driving_time_minutes || 0) + (position.idle_time_minutes || 0);
      const utilizationRate = totalTime > 0 ? 
        ((position.driving_time_minutes || 0) / totalTime) * 100 : 0;
      
      const efficiency = Math.min(100, 
        (position.average_speed || 0) / Math.max(position.max_speed || 1, 1) * 100
      );

      return {
        deviceId: position.device_id,
        deviceName: device?.device_name || `Device ${position.device_id}`,
        efficiency,
        utilizationRate,
        maintenanceScore: 85 + Math.random() * 15, // Mock score
        safetyScore: 80 + Math.random() * 20, // Mock score
        totalDistance: position.total_distance || 0,
        averageSpeed: position.average_speed || 0,
        idlePercentage: totalTime > 0 ? 
          ((position.idle_time_minutes || 0) / totalTime) * 100 : 0,
        alertsCount: Math.floor(Math.random() * 3)
      };
    });
  }, []);

  const generateTrendData = useCallback(async (): Promise<TrendData[]> => {
    // Generate mock trend data for the last 7 days
    const trends: TrendData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        totalDistance: 500 + Math.random() * 200,
        averageSpeed: 45 + Math.random() * 20,
        activeVehicles: 10 + Math.floor(Math.random() * 5),
        fuelConsumption: 80 + Math.random() * 40,
        efficiency: 75 + Math.random() * 20
      });
    }
    
    return trends;
  }, []);

  const refreshAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📊 Refreshing advanced analytics...');
      
      const [analytics, performance, trends] = await Promise.all([
        calculateFleetAnalytics(),
        calculateVehiclePerformance(),
        generateTrendData()
      ]);
      
      setFleetAnalytics(analytics);
      setVehiclePerformance(performance);
      setTrendData(trends);
      
      console.log('✅ Analytics refreshed successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh analytics';
      setError(errorMsg);
      console.error('❌ Analytics refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [calculateFleetAnalytics, calculateVehiclePerformance, generateTrendData]);

  const getVehicleInsights = useCallback(async (deviceId: string) => {
    try {
      console.log(`🔍 Getting insights for device: ${deviceId}`);
      
      const { data: positions, error } = await supabase
        .from('live_positions')
        .select('*')
        .eq('device_id', deviceId)
        .order('position_timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      const insights = {
        recentActivity: positions?.slice(0, 10) || [],
        patterns: {
          mostActiveHours: [9, 10, 14, 15], // Mock data
          preferredRoutes: ['Route A', 'Route B'],
          averageStops: 5,
          fuelEfficiencyTrend: 'improving'
        },
        recommendations: [
          'Consider route optimization for better efficiency',
          'Schedule maintenance check for optimal performance',
          'Monitor driving patterns during peak hours'
        ]
      };

      return insights;
    } catch (err) {
      console.error('Error getting vehicle insights:', err);
      throw err;
    }
  }, []);

  const generateReport = useCallback(async (timeRange: string) => {
    try {
      console.log(`📋 Generating report for: ${timeRange}`);
      
      const report = {
        summary: fleetAnalytics,
        vehicleBreakdown: vehiclePerformance,
        trends: trendData,
        recommendations: [
          'Increase vehicle utilization by 15% through route optimization',
          'Implement predictive maintenance to reduce downtime',
          'Focus driver training on fuel-efficient practices'
        ],
        kpis: {
          efficiency: fleetAnalytics?.performanceScore || 0,
          cost_per_km: 2.5 + Math.random() * 0.5,
          uptime: ((fleetAnalytics?.activeVehicles || 0) / Math.max(fleetAnalytics?.totalVehicles || 1, 1)) * 100,
          safety_score: 85 + Math.random() * 10
        },
        generatedAt: new Date().toISOString(),
        timeRange
      };

      return report;
    } catch (err) {
      console.error('Error generating report:', err);
      throw err;
    }
  }, [fleetAnalytics, vehiclePerformance, trendData]);

  // Initialize analytics on mount
  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  // Set up periodic refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshAnalytics]);

  return {
    fleetAnalytics,
    vehiclePerformance,
    trendData,
    isLoading,
    error,
    refreshAnalytics,
    getVehicleInsights,
    generateReport
  };
}
