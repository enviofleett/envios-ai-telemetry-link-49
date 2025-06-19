
import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketVehicleData } from './useWebSocketVehicleData';
import { useLiveVehicleData } from './useLiveVehicleData';
import { vehicleTrailService } from '@/services/vehicleTrailService';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

interface VehiclePosition {
  device_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

interface UseEnhancedRealtimeOptions {
  enableWebSocket?: boolean;
  enableTrails?: boolean;
  trailHours?: number;
  fallbackPollingInterval?: number;
  maxPositionAge?: number; // in minutes
}

export const useEnhancedRealtimeVehicleData = (
  vehicles: VehicleData[],
  options: UseEnhancedRealtimeOptions = {}
) => {
  const {
    enableWebSocket = true,
    enableTrails = true,
    trailHours = 6,
    fallbackPollingInterval = 30000,
    maxPositionAge = 10
  } = options;

  const [enhancedVehicles, setEnhancedVehicles] = useState<VehicleData[]>(vehicles);
  const [vehicleTrails, setVehicleTrails] = useState<Map<string, any[]>>(new Map());
  const [isLoadingTrails, setIsLoadingTrails] = useState(false);
  const [realtimeStats, setRealtimeStats] = useState({
    totalUpdates: 0,
    lastUpdateTime: null as Date | null,
    websocketConnected: false,
    activeVehicles: 0
  });

  const lastPositionUpdateRef = useRef<Map<string, number>>(new Map());
  const vehicleIds = vehicles.map(v => v.device_id);

  // WebSocket connection for real-time updates
  const {
    isConnected: wsConnected,
    connectionState,
    latestPositions: wsPositions,
    error: wsError,
    requestPositionUpdate
  } = useWebSocketVehicleData(enableWebSocket ? vehicleIds : []);

  // Fallback polling for when WebSocket is not available
  const {
    liveData: pollingData,
    isLoading: isPollingLoading,
    error: pollingError
  } = useLiveVehicleData({
    deviceIds: vehicleIds,
    pollingInterval: fallbackPollingInterval,
    enabled: !wsConnected && vehicleIds.length > 0
  });

  // Determine which data source to use
  const useWebSocketData = wsConnected && wsPositions.size > 0;
  const currentPositions = useWebSocketData ? wsPositions : new Map();

  // Update realtime stats
  useEffect(() => {
    setRealtimeStats(prev => ({
      ...prev,
      websocketConnected: wsConnected,
      activeVehicles: currentPositions.size
    }));
  }, [wsConnected, currentPositions.size]);

  // Merge real-time position data with vehicle data
  const mergePositionData = useCallback((vehicles: VehicleData[], positions: Map<string, VehiclePosition>) => {
    const now = Date.now();
    const maxAgeMs = maxPositionAge * 60 * 1000;

    return vehicles.map(vehicle => {
      const position = positions.get(vehicle.device_id);
      const pollingVehicleData = pollingData[vehicle.device_id];
      
      let enhancedVehicle = { ...vehicle };

      // Use WebSocket position data if available and recent
      if (position) {
        const positionAge = now - new Date(position.timestamp).getTime();
        
        if (positionAge <= maxAgeMs) {
          enhancedVehicle = {
            ...enhancedVehicle,
            last_position: {
              latitude: position.latitude,
              longitude: position.longitude,
              speed: position.speed,
              course: position.heading,
              timestamp: position.timestamp
            },
            isOnline: true,
            isMoving: (position.speed || 0) > 1,
            lastUpdate: new Date(position.timestamp)
          };

          // Track position updates
          const lastUpdate = lastPositionUpdateRef.current.get(vehicle.device_id) || 0;
          if (new Date(position.timestamp).getTime() > lastUpdate) {
            lastPositionUpdateRef.current.set(vehicle.device_id, new Date(position.timestamp).getTime());
            setRealtimeStats(prev => ({
              ...prev,
              totalUpdates: prev.totalUpdates + 1,
              lastUpdateTime: new Date()
            }));
          }
        }
      }
      // Fallback to polling data if WebSocket data is not available
      else if (pollingVehicleData && !useWebSocketData) {
        enhancedVehicle = {
          ...enhancedVehicle,
          last_position: pollingVehicleData.position ? {
            latitude: pollingVehicleData.position.lat,
            longitude: pollingVehicleData.position.lng,
            speed: pollingVehicleData.speed,
            timestamp: pollingVehicleData.lastUpdate.toISOString()
          } : enhancedVehicle.last_position,
          isOnline: pollingVehicleData.status === 'online' || pollingVehicleData.status === 'moving',
          isMoving: pollingVehicleData.status === 'moving',
          lastUpdate: pollingVehicleData.lastUpdate
        };
      }

      return enhancedVehicle;
    });
  }, [pollingData, useWebSocketData, maxPositionAge]);

  // Update enhanced vehicles when position data changes
  useEffect(() => {
    const enhanced = mergePositionData(vehicles, currentPositions);
    setEnhancedVehicles(enhanced);
  }, [vehicles, currentPositions, mergePositionData]);

  // Load vehicle trails
  const loadVehicleTrails = useCallback(async (deviceIds: string[]) => {
    if (!enableTrails || deviceIds.length === 0) return;

    setIsLoadingTrails(true);
    try {
      const trailPromises = deviceIds.map(async (deviceId) => {
        const trail = await vehicleTrailService.getVehicleTrail(deviceId, trailHours);
        return { deviceId, trail };
      });

      const results = await Promise.all(trailPromises);
      const newTrails = new Map();
      
      results.forEach(({ deviceId, trail }) => {
        if (trail.length > 0) {
          // Simplify trail for better performance
          const simplifiedTrail = vehicleTrailService.simplifyTrail(trail, 0.0001);
          newTrails.set(deviceId, simplifiedTrail);
        }
      });

      setVehicleTrails(newTrails);
    } catch (error) {
      console.error('Error loading vehicle trails:', error);
    } finally {
      setIsLoadingTrails(false);
    }
  }, [enableTrails, trailHours]);

  // Load trails when vehicles change
  useEffect(() => {
    if (enableTrails && vehicleIds.length > 0) {
      loadVehicleTrails(vehicleIds);
    }
  }, [vehicleIds, enableTrails, loadVehicleTrails]);

  // Refresh trails periodically
  useEffect(() => {
    if (!enableTrails) return;

    const interval = setInterval(() => {
      if (vehicleIds.length > 0) {
        loadVehicleTrails(vehicleIds);
      }
    }, 5 * 60 * 1000); // Refresh trails every 5 minutes

    return () => clearInterval(interval);
  }, [vehicleIds, enableTrails, loadVehicleTrails]);

  // Subscribe to real-time position updates from database
  useEffect(() => {
    if (vehicleIds.length === 0) return;

    const channel = supabase
      .channel('vehicle-positions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vehicle_positions',
          filter: `device_id=in.(${vehicleIds.join(',')})`
        },
        (payload) => {
          console.log('📍 New position from database:', payload.new);
          
          // Update positions map with new data
          setRealtimeStats(prev => ({
            ...prev,
            totalUpdates: prev.totalUpdates + 1,
            lastUpdateTime: new Date()
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vehicleIds]);

  const refreshPositions = useCallback(() => {
    if (wsConnected) {
      requestPositionUpdate();
    }
  }, [wsConnected, requestPositionUpdate]);

  const getVehicleTrail = useCallback((deviceId: string) => {
    return vehicleTrails.get(deviceId) || [];
  }, [vehicleTrails]);

  const forceRefreshTrails = useCallback(() => {
    if (vehicleIds.length > 0) {
      loadVehicleTrails(vehicleIds);
    }
  }, [vehicleIds, loadVehicleTrails]);

  return {
    vehicles: enhancedVehicles,
    vehicleTrails,
    isLoadingTrails,
    realtimeStats,
    connectionState,
    error: wsError || pollingError,
    isWebSocketConnected: wsConnected,
    refreshPositions,
    getVehicleTrail,
    forceRefreshTrails,
    loadVehicleTrails
  };
};
