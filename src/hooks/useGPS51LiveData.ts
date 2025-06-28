
import { useState, useEffect, useCallback, useRef } from 'react';
import { gps51LiveDataService, GPS51Position, GPS51Device, GPS51DeviceGroup } from '@/services/gp51/GPS51LiveDataService';
import { gps51SessionManager } from '@/services/gp51/GPS51SessionManager';

export interface LiveDataOptions {
  deviceIds?: string[];
  autoStart?: boolean;
  enablePolling?: boolean;
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
    deviceIds = [],
    autoStart = true,
    enablePolling = true
  } = options;

  const [positions, setPositions] = useState<Map<string, GPS51Position>>(new Map());
  const [deviceGroups, setDeviceGroups] = useState<GPS51DeviceGroup[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [metrics, setMetrics] = useState<FleetMetrics | null>(null);
  
  const initializationRef = useRef(false);

  // Calculate fleet metrics whenever positions or devices change
  const calculateMetrics = useCallback((currentPositions: Map<string, GPS51Position>, groups: GPS51DeviceGroup[]) => {
    const allDevices: GPS51Device[] = groups.flatMap(group => group.devices || []);
    const totalDevices = allDevices.length;
    
    let activeDevices = 0;
    let movingDevices = 0;
    let parkedDevices = 0;
    let offlineDevices = 0;

    allDevices.forEach(device => {
      const position = currentPositions.get(device.deviceid);
      
      if (position) {
        activeDevices++;
        if (position.moving === 1 || position.speed > 0) {
          movingDevices++;
        } else {
          parkedDevices++;
        }
      } else {
        offlineDevices++;
      }
    });

    return {
      totalDevices,
      activeDevices,
      movingDevices,
      parkedDevices,
      offlineDevices,
      lastUpdate: new Date()
    };
  }, []);

  // Handle real-time position updates
  useEffect(() => {
    const handlePositionUpdate = (event: CustomEvent) => {
      const { positions: newPositions, timestamp } = event.detail;
      
      setPositions(prev => {
        const updated = new Map(prev);
        newPositions.forEach((pos: GPS51Position) => {
          updated.set(pos.deviceid, pos);
        });
        return updated;
      });
      
      setLastUpdate(new Date(timestamp));
      setError(null); // Clear any previous errors on successful update
    };

    const handleDeviceListUpdate = (event: CustomEvent) => {
      const { groups } = event.detail;
      setDeviceGroups(groups);
    };

    const handleConnectionLost = () => {
      setIsConnected(false);
      setError('Connection to GPS51 lost');
    };

    // Add event listeners
    window.addEventListener('gps51PositionUpdate', handlePositionUpdate as EventListener);
    window.addEventListener('gps51DeviceListUpdate', handleDeviceListUpdate as EventListener);
    window.addEventListener('gps51ConnectionLost', handleConnectionLost as EventListener);
    
    return () => {
      window.removeEventListener('gps51PositionUpdate', handlePositionUpdate as EventListener);
      window.removeEventListener('gps51DeviceListUpdate', handleDeviceListUpdate as EventListener);
      window.removeEventListener('gps51ConnectionLost', handleConnectionLost as EventListener);
    };
  }, []);

  // Update metrics when positions or device groups change
  useEffect(() => {
    if (deviceGroups.length > 0) {
      const newMetrics = calculateMetrics(positions, deviceGroups);
      setMetrics(newMetrics);
    }
  }, [positions, deviceGroups, calculateMetrics]);

  // Initialize service and start polling
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initializeService = async () => {
      if (!autoStart) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('🚀 Initializing GPS51 live data service...');

        // Initialize session manager
        const sessionInitialized = await gps51SessionManager.initialize();
        if (!sessionInitialized) {
          throw new Error('No valid GPS51 session found. Please authenticate first.');
        }

        // Get device list first
        const groups = await gps51LiveDataService.getDeviceList();
        setDeviceGroups(groups);

        // Start real-time polling if enabled
        if (enablePolling) {
          await gps51LiveDataService.startRealTimePolling(deviceIds);
          console.log('✅ Real-time polling started');
        }
        
        setIsConnected(true);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize GPS51 service';
        console.error('❌ GPS51 initialization failed:', errorMessage);
        setError(errorMessage);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      if (enablePolling) {
        gps51LiveDataService.stopPolling();
      }
    };
  }, []); // Empty dependency array for one-time initialization

  // Manual refresh function
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Manually refreshing GPS51 data...');
      
      // Refresh device list
      const groups = await gps51LiveDataService.getDeviceList();
      setDeviceGroups(groups);
      
      // Get fresh positions
      const freshPositions = await gps51LiveDataService.pollLatestPositions(deviceIds);
      
      // Update positions map
      setPositions(prev => {
        const updated = new Map(prev);
        freshPositions.forEach(pos => {
          updated.set(pos.deviceid, pos);
        });
        return updated;
      });
      
      setLastUpdate(new Date());
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      setError(errorMessage);
      console.error('❌ Refresh failed:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [deviceIds]);

  // Start polling manually
  const startPolling = useCallback(async () => {
    try {
      await gps51LiveDataService.startRealTimePolling(deviceIds);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start polling';
      setError(errorMessage);
      setIsConnected(false);
    }
  }, [deviceIds]);

  // Stop polling manually
  const stopPolling = useCallback(() => {
    gps51LiveDataService.stopPolling();
    setIsConnected(false);
  }, []);

  // Get device by ID
  const getDevice = useCallback((deviceId: string): GPS51Device | undefined => {
    for (const group of deviceGroups) {
      const device = group.devices?.find(d => d.deviceid === deviceId);
      if (device) return device;
    }
    return undefined;
  }, [deviceGroups]);

  // Get position by device ID
  const getPosition = useCallback((deviceId: string): GPS51Position | undefined => {
    return positions.get(deviceid);
  }, [positions]);

  // Get all devices flattened
  const getAllDevices = useCallback((): GPS51Device[] => {
    return deviceGroups.flatMap(group => group.devices || []);
  }, [deviceGroups]);

  // Get all positions as array
  const getAllPositions = useCallback((): GPS51Position[] => {
    return Array.from(positions.values());
  }, [positions]);

  return {
    // Data
    positions: getAllPositions(),
    deviceGroups,
    devices: getAllDevices(),
    metrics,
    
    // Status
    isConnected,
    isLoading,
    error,
    lastUpdate,
    isPolling: gps51LiveDataService.isCurrentlyPolling(),
    
    // Actions
    refresh,
    startPolling,
    stopPolling,
    
    // Utilities
    getDevice,
    getPosition
  };
};
