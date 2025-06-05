
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FleetMetrics {
  totalVehicles: number;
  activeVehicles: number;
  onlineVehicles: number;
  utilizationRate: number;
  averageSpeed: number;
  fuelEfficiency: number;
  maintenanceAlerts: number;
  costPerMile: number;
}

export interface VehicleAnalytics {
  deviceId: string;
  deviceName: string;
  utilizationRate: number;
  fuelEfficiency: number;
  maintenanceScore: number;
  driverScore: number;
  alerts: number;
  lastUpdate: string;
}

export const useFleetAnalytics = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });

  // Fetch vehicle data for analytics
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['fleet-analytics-vehicles', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          device_subscriptions(*)
        `)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate fleet metrics
  const fleetMetrics: FleetMetrics = useMemo(() => {
    if (!vehicles) return {
      totalVehicles: 0,
      activeVehicles: 0,
      onlineVehicles: 0,
      utilizationRate: 0,
      averageSpeed: 0,
      fuelEfficiency: 0,
      maintenanceAlerts: 0,
      costPerMile: 0
    };

    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.is_active).length;
    
    // Calculate online vehicles (last update within 30 minutes)
    const onlineVehicles = vehicles.filter(v => {
      if (!v.last_position?.updatetime) return false;
      const lastUpdate = new Date(v.last_position.updatetime);
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      return lastUpdate > thirtyMinutesAgo;
    }).length;

    const utilizationRate = totalVehicles > 0 ? (onlineVehicles / totalVehicles) * 100 : 0;
    
    // Calculate average speed from online vehicles
    const onlineVehiclesWithSpeed = vehicles.filter(v => 
      v.last_position?.speed !== undefined && 
      v.last_position?.updatetime &&
      new Date(v.last_position.updatetime) > new Date(Date.now() - 30 * 60 * 1000)
    );
    
    const averageSpeed = onlineVehiclesWithSpeed.length > 0 
      ? onlineVehiclesWithSpeed.reduce((sum, v) => sum + (v.last_position?.speed || 0), 0) / onlineVehiclesWithSpeed.length
      : 0;

    // Mock calculations for other metrics (would be calculated from historical data)
    const fuelEfficiency = 8.5; // km/l average
    const maintenanceAlerts = vehicles.filter(v => 
      v.status?.toLowerCase().includes('maintenance') || 
      v.status?.toLowerCase().includes('alert')
    ).length;
    const costPerMile = 0.45; // USD per mile

    return {
      totalVehicles,
      activeVehicles,
      onlineVehicles,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      averageSpeed: Math.round(averageSpeed * 100) / 100,
      fuelEfficiency,
      maintenanceAlerts,
      costPerMile
    };
  }, [vehicles]);

  // Calculate individual vehicle analytics
  const vehicleAnalytics: VehicleAnalytics[] = useMemo(() => {
    if (!vehicles) return [];

    return vehicles.map(vehicle => {
      const isOnline = vehicle.last_position?.updatetime && 
        new Date(vehicle.last_position.updatetime) > new Date(Date.now() - 30 * 60 * 1000);
      
      // Mock analytics calculations (would use historical data)
      const utilizationRate = isOnline ? Math.random() * 40 + 60 : Math.random() * 30; // 60-100% or 0-30%
      const fuelEfficiency = Math.random() * 3 + 7; // 7-10 km/l
      const maintenanceScore = Math.random() * 20 + 80; // 80-100%
      const driverScore = Math.random() * 15 + 85; // 85-100%
      const alerts = vehicle.status?.toLowerCase().includes('alert') ? Math.floor(Math.random() * 3) + 1 : 0;

      return {
        deviceId: vehicle.device_id,
        deviceName: vehicle.device_name,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        fuelEfficiency: Math.round(fuelEfficiency * 100) / 100,
        maintenanceScore: Math.round(maintenanceScore * 100) / 100,
        driverScore: Math.round(driverScore * 100) / 100,
        alerts,
        lastUpdate: vehicle.last_position?.updatetime || vehicle.updated_at
      };
    });
  }, [vehicles]);

  return {
    fleetMetrics,
    vehicleAnalytics,
    dateRange,
    setDateRange,
    isLoading: vehiclesLoading,
    refreshData: () => {
      // This would trigger a refetch
    }
  };
};
