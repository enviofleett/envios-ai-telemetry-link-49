
import { useState, useEffect } from 'react';
import { useGP51VehicleData, type EnhancedVehicle } from '@/hooks/useGP51VehicleData';
import { useGP51Auth } from '@/hooks/useGP51Auth';
import type { SyncMetrics, VehicleData } from '@/types/vehicle';

interface FilterOptions {
  search?: string;
  status?: 'all' | 'online' | 'offline' | 'alerts';
  user?: string;
}

// Transform EnhancedVehicle to VehicleData
const transformToVehicleData = (enhancedVehicle: EnhancedVehicle): VehicleData => {
  return {
    id: enhancedVehicle.id || enhancedVehicle.deviceId,
    deviceId: enhancedVehicle.deviceId,
    deviceName: enhancedVehicle.deviceName,
    vehicleName: enhancedVehicle.vehicle_name,
    make: enhancedVehicle.make,
    model: enhancedVehicle.model,
    year: enhancedVehicle.year,
    licensePlate: enhancedVehicle.license_plate,
    status: enhancedVehicle.status,
    lastUpdate: enhancedVehicle.timestamp || new Date(),
    position: enhancedVehicle.latitude && enhancedVehicle.longitude ? {
      latitude: enhancedVehicle.latitude,
      longitude: enhancedVehicle.longitude,
      speed: enhancedVehicle.speed,
      course: enhancedVehicle.course,
    } : undefined,
    location: enhancedVehicle.latitude && enhancedVehicle.longitude ? {
      latitude: enhancedVehicle.latitude,
      longitude: enhancedVehicle.longitude,
      speed: enhancedVehicle.speed,
      course: enhancedVehicle.course,
    } : undefined,
    speed: enhancedVehicle.speed,
    course: enhancedVehicle.course,
    isOnline: enhancedVehicle.isOnline,
    isMoving: enhancedVehicle.isMoving,
    alerts: enhancedVehicle.statusText && enhancedVehicle.statusText !== 'Normal' ? [enhancedVehicle.statusText] : [],
    is_active: enhancedVehicle.is_active || enhancedVehicle.isOnline,
    envio_user_id: enhancedVehicle.envio_user_id,
    lastPosition: enhancedVehicle.lastPosition ? {
      lat: enhancedVehicle.lastPosition.lat,
      lon: enhancedVehicle.lastPosition.lng, // Convert lng to lon
      speed: enhancedVehicle.lastPosition.speed,
      course: enhancedVehicle.lastPosition.course,
      updatetime: enhancedVehicle.lastPosition.updatetime,
      statusText: enhancedVehicle.lastPosition.statusText,
    } : undefined,
  };
};

export const useUnifiedVehicleData = (filters?: FilterOptions) => {
  const { isAuthenticated } = useGP51Auth();
  
  // Use GP51 data as primary source
  const {
    vehicles: gp51Vehicles,
    metrics: gp51Metrics,
    isLoading,
    isRefreshing,
    forceRefresh,
    getOnlineVehicles,
    getOfflineVehicles,
    getMovingVehicles,
    getIdleVehicles
  } = useGP51VehicleData({
    autoRefresh: isAuthenticated,
    refreshInterval: 30000
  });

  const [vehicles, setVehicles] = useState<VehicleData[]>([]);

  // Transform and filter vehicles
  useEffect(() => {
    let transformedVehicles = gp51Vehicles.map(transformToVehicleData);

    if (filters) {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        transformedVehicles = transformedVehicles.filter(vehicle => 
          (vehicle.deviceName?.toLowerCase().includes(searchTerm) || false) ||
          (vehicle.vehicleName?.toLowerCase().includes(searchTerm) || false) ||
          vehicle.deviceId.toLowerCase().includes(searchTerm) ||
          (vehicle.licensePlate?.toLowerCase().includes(searchTerm) || false)
        );
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        switch (filters.status) {
          case 'online':
            transformedVehicles = transformedVehicles.filter(v => v.isOnline);
            break;
          case 'offline':
            transformedVehicles = transformedVehicles.filter(v => !v.isOnline);
            break;
          case 'alerts':
            transformedVehicles = transformedVehicles.filter(v => v.alerts.length > 0);
            break;
        }
      }

      // User filter
      if (filters.user && filters.user !== 'all') {
        transformedVehicles = transformedVehicles.filter(v => v.envio_user_id === filters.user);
      }
    }

    setVehicles(transformedVehicles);
  }, [gp51Vehicles, filters]);

  // Transform GP51 metrics to unified format
  const metrics = {
    total: gp51Metrics.total,
    online: gp51Metrics.online,
    offline: gp51Metrics.offline,
    alerts: vehicles.filter(v => v.alerts.length > 0).length,
    lastUpdateTime: gp51Metrics.lastUpdateTime
  };

  const syncMetrics: SyncMetrics = {
    totalVehicles: gp51Metrics.total,
    positionsUpdated: gp51Metrics.online,
    errors: gp51Metrics.syncStatus === 'error' ? 1 : 0,
    lastSyncTime: gp51Metrics.lastUpdateTime
  };

  const getVehiclesByStatus = () => {
    return {
      online: vehicles.filter(v => v.isOnline),
      offline: vehicles.filter(v => !v.isOnline),
      alerts: vehicles.filter(v => v.alerts.length > 0)
    };
  };

  const getVehicleById = (deviceId: string) => {
    return vehicles.find(v => v.deviceId === deviceId);
  };

  return {
    vehicles,
    metrics,
    syncMetrics,
    isLoading,
    isRefreshing,
    forceRefresh,
    getVehiclesByStatus,
    getVehicleById,
    getOnlineVehicles: () => vehicles.filter(v => v.isOnline),
    getOfflineVehicles: () => vehicles.filter(v => !v.isOnline),
    getMovingVehicles: () => vehicles.filter(v => v.isMoving),
    getIdleVehicles: () => vehicles.filter(v => v.isOnline && !v.isMoving)
  };
};
