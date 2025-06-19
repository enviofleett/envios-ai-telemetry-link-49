
import { useCallback, useEffect, useRef } from 'react';
import { useGeofencing } from './useGeofencing';
import type { VehicleData } from '@/types/vehicle';

interface GeofencingIntegrationOptions {
  enableRealtimeChecking: boolean;
  checkInterval: number; // milliseconds
  enableNotifications: boolean;
}

export const useGeofencingIntegration = (
  vehicles: VehicleData[],
  options: GeofencingIntegrationOptions = {
    enableRealtimeChecking: true,
    checkInterval: 30000, // 30 seconds
    enableNotifications: true
  }
) => {
  const { geofences, checkVehicleGeofences } = useGeofencing();
  const lastCheckRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if a vehicle has moved significantly
  const hasVehicleMoved = useCallback((
    deviceId: string, 
    newLat: number, 
    newLng: number, 
    threshold = 0.0001 // ~10 meters
  ): boolean => {
    const lastPosition = lastCheckRef.current.get(deviceId);
    if (!lastPosition) return true;

    const latDiff = Math.abs(newLat - lastPosition.lat);
    const lngDiff = Math.abs(newLng - lastPosition.lng);

    return latDiff > threshold || lngDiff > threshold;
  }, []);

  // Process geofence checks for vehicles
  const processGeofenceChecks = useCallback(async () => {
    if (!options.enableRealtimeChecking || geofences.length === 0) return;

    const vehiclesWithPosition = vehicles.filter(v => 
      v.last_position?.latitude && 
      v.last_position?.longitude &&
      v.isOnline // Only check online vehicles
    );

    for (const vehicle of vehiclesWithPosition) {
      const { latitude, longitude } = vehicle.last_position!;
      
      // Only check if vehicle has moved significantly
      if (hasVehicleMoved(vehicle.device_id, latitude, longitude)) {
        try {
          await checkVehicleGeofences(vehicle.device_id, latitude, longitude);
          
          // Update last checked position
          lastCheckRef.current.set(vehicle.device_id, {
            lat: latitude,
            lng: longitude
          });
        } catch (error) {
          console.error(`Failed to check geofences for vehicle ${vehicle.device_id}:`, error);
        }
      }
    }
  }, [vehicles, geofences, checkVehicleGeofences, hasVehicleMoved, options.enableRealtimeChecking]);

  // Set up periodic geofence checking
  useEffect(() => {
    if (options.enableRealtimeChecking) {
      intervalRef.current = setInterval(processGeofenceChecks, options.checkInterval);
      
      // Initial check
      processGeofenceChecks();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [processGeofenceChecks, options.enableRealtimeChecking, options.checkInterval]);

  // Manual geofence check for specific vehicle
  const checkVehicleManually = useCallback(async (vehicle: VehicleData) => {
    if (!vehicle.last_position) return;

    const { latitude, longitude } = vehicle.last_position;
    await checkVehicleGeofences(vehicle.device_id, latitude, longitude);
    
    lastCheckRef.current.set(vehicle.device_id, {
      lat: latitude,
      lng: longitude
    });
  }, [checkVehicleGeofences]);

  // Get geofence status for a specific vehicle
  const getVehicleGeofenceStatus = useCallback((vehicle: VehicleData) => {
    if (!vehicle.last_position) return null;

    const { latitude, longitude } = vehicle.last_position;
    
    // Check which geofences this vehicle is currently in
    const currentGeofences = geofences.filter(geofence => {
      if (!geofence.is_active) return false;
      
      // Simple point-in-polygon check for demonstration
      // In a real implementation, you'd use a proper geospatial library
      return isPointInGeofence(latitude, longitude, geofence.geometry);
    });

    return {
      insideGeofences: currentGeofences.filter(g => g.fence_type === 'inclusion'),
      outsideExclusionZones: geofences.filter(g => 
        g.fence_type === 'exclusion' && 
        !isPointInGeofence(latitude, longitude, g.geometry)
      ),
      violatingExclusionZones: geofences.filter(g => 
        g.fence_type === 'exclusion' && 
        isPointInGeofence(latitude, longitude, g.geometry)
      )
    };
  }, [geofences]);

  // Helper function for point-in-polygon check (simplified)
  const isPointInGeofence = useCallback((lat: number, lng: number, geometry: any): boolean => {
    if (!geometry?.coordinates?.[0]) return false;
    
    const coordinates = geometry.coordinates[0];
    const x = lng;
    const y = lat;
    let inside = false;

    for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
      const xi = coordinates[i][0];
      const yi = coordinates[i][1];
      const xj = coordinates[j][0];
      const yj = coordinates[j][1];

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }, []);

  // Get statistics about geofencing
  const getGeofencingStats = useCallback(() => {
    const vehiclesWithPosition = vehicles.filter(v => v.last_position);
    const onlineVehicles = vehiclesWithPosition.filter(v => v.isOnline);
    
    let vehiclesInInclusionZones = 0;
    let vehiclesInExclusionZones = 0;
    
    onlineVehicles.forEach(vehicle => {
      const status = getVehicleGeofenceStatus(vehicle);
      if (status) {
        if (status.insideGeofences.length > 0) {
          vehiclesInInclusionZones++;
        }
        if (status.violatingExclusionZones.length > 0) {
          vehiclesInExclusionZones++;
        }
      }
    });

    return {
      totalGeofences: geofences.length,
      activeGeofences: geofences.filter(g => g.is_active).length,
      inclusionZones: geofences.filter(g => g.fence_type === 'inclusion').length,
      exclusionZones: geofences.filter(g => g.fence_type === 'exclusion').length,
      monitoredVehicles: onlineVehicles.length,
      vehiclesInInclusionZones,
      vehiclesInExclusionZones,
      lastCheckCount: lastCheckRef.current.size
    };
  }, [vehicles, geofences, getVehicleGeofenceStatus]);

  return {
    processGeofenceChecks,
    checkVehicleManually,
    getVehicleGeofenceStatus,
    getGeofencingStats,
    isMonitoring: options.enableRealtimeChecking && geofences.length > 0
  };
};
