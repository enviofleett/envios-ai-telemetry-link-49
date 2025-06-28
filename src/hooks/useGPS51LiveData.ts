
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gps51LiveDataService, GPS51Position, GPS51Device } from '@/services/gps51/GPS51LiveDataService';
import { useGPS51SessionBridge } from '@/hooks/useGPS51SessionBridge';

export interface LiveDataOptions {
  deviceIds?: string[];
  refreshInterval?: number;
  enabled?: boolean;
  autoStart?: boolean;
}

export interface FleetMetrics {
  totalDevices: number;
  activeDevices: number;
  movingDevices: number;
  parkedDevices: number;
  offlineDevices: number;
  lastUpdate: Date;
}

export const useGPS51LiveData = (options: LiveDataOptions = {}) => {
  const {
    deviceIds,
    refreshInterval = 30000, // 30 seconds
    enabled = true,
    autoStart = true
  } = options;

  const [isLiveTracking, setIsLiveTracking] = useState(autoStart);
  const [positions, setPositions] = useState<Map<string, GPS51Position>>(new Map());
  const [devices, setDevices] = useState<GPS51Device[]>([]);
  const [metrics, setMetrics] = useState<FleetMetrics | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { hasValidSession, isSessionReady, error: sessionError } = useGPS51SessionBridge();

  // Query for device list
  const {
    data: devicesData,
    isLoading: devicesLoading,
    error: devicesError,
    refetch: refetchDevices
  } = useQuery({
    queryKey: ['gps51-devices'],
    queryFn: () => gps51LiveDataService.getDeviceList(),
    enabled: enabled && hasValidSession && isSessionReady,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Query for live positions
  const {
    data: positionsData,
    isLoading: positionsLoading,
    error: positionsError,
    refetch: refetchPositions
  } = useQuery({
    queryKey: ['gps51-positions', deviceIds],
    queryFn: () => gps51LiveDataService.getLastPositions(deviceIds),
    enabled: enabled && isLiveTracking && hasValidSession && isSessionReady,
    refetchInterval: isLiveTracking ? refreshInterval : false,
    staleTime: 15000, // 15 seconds
    retry: 2
  });

  // Update devices state
  useEffect(() => {
    if (devicesData?.devices) {
      setDevices(devicesData.devices);
    }
  }, [devicesData]);

  // Update positions state and metrics
  useEffect(() => {
    if (positionsData?.records) {
      const newPositions = new Map<string, GPS51Position>();
      
      positionsData.records.forEach(position => {
        newPositions.set(position.deviceid, position);
      });

      setPositions(newPositions);
      updateMetrics(newPositions, devices);
    }
  }, [positionsData, devices]);

  // Calculate fleet metrics
  const updateMetrics = useCallback((positionsMap: Map<string, GPS51Position>, devicesList: GPS51Device[]) => {
    const now = Date.now() / 1000;
    const fiveMinutesAgo = now - 300; // 5 minutes

    let activeCount = 0;
    let movingCount = 0;
    let parkedCount = 0;
    let offlineCount = 0;

    devicesList.forEach(device => {
      const position = positionsMap.get(device.deviceid);
      
      if (position && position.updatetime > fiveMinutesAgo) {
        activeCount++;
        if (position.moving === 1 || position.speed > 0) {
          movingCount++;
        } else {
          parkedCount++;
        }
      } else {
        offlineCount++;
      }
    });

    setMetrics({
      totalDevices: devicesList.length,
      activeDevices: activeCount,
      movingDevices: movingCount,
      parkedDevices: parkedCount,
      offlineDevices: offlineCount,
      lastUpdate: new Date()
    });
  }, []);

  // Start live tracking
  const startLiveTracking = useCallback(() => {
    if (!hasValidSession) {
      console.warn('⚠️ Cannot start live tracking: No valid GPS51 session');
      return;
    }
    
    console.log('🎯 Starting GPS51 live tracking...');
    setIsLiveTracking(true);
  }, [hasValidSession]);

  // Stop live tracking
  const stopLiveTracking = useCallback(() => {
    console.log('⏹️ Stopping GPS51 live tracking...');
    setIsLiveTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Manual refresh
  const refreshData = useCallback(async () => {
    if (!hasValidSession) {
      console.warn('⚠️ Cannot refresh data: No valid GPS51 session');
      return;
    }
    
    console.log('🔄 Manually refreshing GPS51 data...');
    await Promise.all([
      refetchDevices(),
      refetchPositions()
    ]);
  }, [refetchDevices, refetchPositions, hasValidSession]);

  // Get position for specific device
  const getDevicePosition = useCallback((deviceId: string): GPS51Position | undefined => {
    return positions.get(deviceId);
  }, [positions]);

  // Get device info
  const getDeviceInfo = useCallback((deviceId: string): GPS51Device | undefined => {
    return devices.find(device => device.deviceid === deviceId);
  }, [devices]);

  // Check if device is online
  const isDeviceOnline = useCallback((deviceId: string): boolean => {
    const position = positions.get(deviceId);
    if (!position) return false;
    
    const now = Date.now() / 1000;
    const fiveMinutesAgo = now - 300;
    
    return position.updatetime > fiveMinutesAgo;
  }, [positions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Determine the overall error state
  const error = sessionError || devicesError || positionsError;

  return {
    // Data
    devices,
    positions: Array.from(positions.values()),
    positionsMap: positions,
    metrics,

    // Loading states
    isLoading: !isSessionReady || devicesLoading || positionsLoading,
    devicesLoading,
    positionsLoading,

    // Error states
    error: error ? (typeof error === 'string' ? error : error.message || 'Unknown error') : null,
    devicesError,
    positionsError,
    sessionError,

    // Session state
    hasValidSession,
    isSessionReady,

    // Tracking state
    isLiveTracking,

    // Actions
    startLiveTracking,
    stopLiveTracking,
    refreshData,
    refetchDevices,
    refetchPositions,

    // Helpers
    getDevicePosition,
    getDeviceInfo,
    isDeviceOnline
  };
};
