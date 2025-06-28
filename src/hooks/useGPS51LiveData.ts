
import { useState, useEffect, useCallback } from 'react';
import { gps51LiveDataService, GPS51Position, GPS51Device, GPS51DeviceGroup } from '@/services/gp51/GPS51LiveDataService';
import { gps51SessionManager } from '@/services/gp51/GPS51SessionManager';

export interface FleetMetrics {
  totalVehicles: number;
  onlineVehicles: number;
  movingVehicles: number;
  idleVehicles: number;
  offlineVehicles: number;
}

export interface LiveDataOptions {
  deviceIds?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useGPS51LiveData(options: LiveDataOptions = {}) {
  const { deviceIds = [], autoRefresh = true } = options;
  
  const [positions, setPositions] = useState<GPS51Position[]>([]);
  const [deviceGroups, setDeviceGroups] = useState<GPS51DeviceGroup[]>([]);
  const [devices, setDevices] = useState<GPS51Device[]>([]);
  const [metrics, setMetrics] = useState<FleetMetrics>({
    totalVehicles: 0,
    onlineVehicles: 0,
    movingVehicles: 0,
    idleVehicles: 0,
    offlineVehicles: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  // Calculate fleet metrics from positions and devices
  const calculateMetrics = useCallback((allDevices: GPS51Device[], allPositions: GPS51Position[]): FleetMetrics => {
    const totalVehicles = allDevices.length;
    let onlineVehicles = 0;
    let movingVehicles = 0;
    let idleVehicles = 0;

    allDevices.forEach(device => {
      const position = allPositions.find(p => p.deviceId === device.deviceid);
      
      if (position) {
        onlineVehicles++;
        if (position.moving === 1) {
          movingVehicles++;
        } else {
          idleVehicles++;
        }
      }
    });

    return {
      totalVehicles,
      onlineVehicles,
      movingVehicles,
      idleVehicles,
      offlineVehicles: totalVehicles - onlineVehicles
    };
  }, []);

  // Handle real-time position updates
  useEffect(() => {
    const handlePositionUpdate = (event: CustomEvent) => {
      const { positions: newPositions } = event.detail;
      
      setPositions(prev => {
        const merged = [...prev];
        newPositions.forEach((newPos: GPS51Position) => {
          const index = merged.findIndex(p => p.deviceId === newPos.deviceId);
          if (index >= 0) {
            merged[index] = newPos;
          } else {
            merged.push(newPos);
          }
        });
        return merged;
      });
      
      setLastUpdate(new Date());
    };

    const handleDeviceListUpdate = (event: CustomEvent) => {
      const { groups } = event.detail;
      setDeviceGroups(groups);
      
      const allDevices = groups.flatMap((group: GPS51DeviceGroup) => group.devices || []);
      setDevices(allDevices);
    };

    window.addEventListener('gps51PositionUpdate', handlePositionUpdate as EventListener);
    window.addEventListener('gps51DeviceListUpdate', handleDeviceListUpdate as EventListener);
    
    return () => {
      window.removeEventListener('gps51PositionUpdate', handlePositionUpdate as EventListener);
      window.removeEventListener('gps51DeviceListUpdate', handleDeviceListUpdate as EventListener);
    };
  }, []);

  // Update metrics whenever positions or devices change
  useEffect(() => {
    const newMetrics = calculateMetrics(devices, positions);
    setMetrics(newMetrics);
  }, [devices, positions, calculateMetrics]);

  // Initialize session and fetch initial data
  useEffect(() => {
    const initializeService = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Initialize session manager
        const sessionValid = await gps51SessionManager.initialize();
        if (!sessionValid) {
          // Try to validate existing session
          const isValid = await gps51SessionManager.validateSession();
          if (!isValid) {
            throw new Error('No valid GPS51 session found. Please authenticate first.');
          }
        }

        // Get device list
        const groups = await gps51LiveDataService.getDeviceList();
        setDeviceGroups(groups);
        
        const allDevices = groups.flatMap((group: GPS51DeviceGroup) => group.devices || []);
        setDevices(allDevices);

        // Get initial positions
        const initialPositions = await gps51LiveDataService.pollLatestPositions(deviceIds);
        setPositions(initialPositions);

        setIsConnected(true);
        console.log('✅ GPS51 Live Data service initialized successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize GPS51 service';
        setError(errorMessage);
        setIsConnected(false);
        console.error('❌ GPS51 Live Data initialization failed:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, [deviceIds]);

  // Start/stop live tracking
  const startLiveTracking = useCallback(async () => {
    try {
      setError(null);
      await gps51LiveDataService.startRealTimePolling(deviceIds);
      setIsLiveTracking(true);
      console.log('🚀 Live tracking started');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start live tracking';
      setError(errorMessage);
      console.error('❌ Failed to start live tracking:', errorMessage);
    }
  }, [deviceIds]);

  const stopLiveTracking = useCallback(() => {
    gps51LiveDataService.stopPolling();
    setIsLiveTracking(false);
    console.log('⏹️ Live tracking stopped');
  }, []);

  // Auto-start live tracking if enabled
  useEffect(() => {
    if (autoRefresh && isConnected && !isLiveTracking) {
      startLiveTracking();
    }

    return () => {
      if (isLiveTracking) {
        stopLiveTracking();
      }
    };
  }, [autoRefresh, isConnected, isLiveTracking, startLiveTracking, stopLiveTracking]);

  // Manual refresh
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newPositions = await gps51LiveDataService.pollLatestPositions(deviceIds);
      setPositions(newPositions);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [deviceIds]);

  // Get device by ID
  const getDevice = useCallback((deviceId: string) => {
    return devices.find(d => d.deviceid === deviceId);
  }, [devices]);

  // Get position by device ID
  const getPosition = useCallback((deviceId: string) => {
    return positions.find(p => p.deviceId === deviceId);
  }, [positions]);

  // Get device position (alias for backward compatibility)
  const getDevicePosition = useCallback((deviceId: string) => {
    return getPosition(deviceId);
  }, [getPosition]);

  return {
    positions,
    deviceGroups,
    devices,
    metrics,
    isConnected,
    isLoading,
    error,
    lastUpdate,
    isLiveTracking,
    startLiveTracking,
    stopLiveTracking,
    refreshData,
    getDevice,
    getPosition,
    getDevicePosition
  };
}
