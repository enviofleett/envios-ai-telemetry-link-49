
import { useState, useEffect, useCallback } from 'react';
import { gps51LiveDataService } from '@/services/gp51/GPS51LiveDataService';
import type { GPS51Position, GPS51Device, GPS51DeviceGroup, FleetMetrics, LiveDataOptions } from '@/services/gp51/GPS51LiveDataService';

export const useGPS51LiveData = (options: LiveDataOptions = {}) => {
  const [positions, setPositions] = useState<GPS51Position[]>([]);
  const [deviceGroups, setDeviceGroups] = useState<GPS51DeviceGroup[]>([]);
  const [devices, setDevices] = useState<GPS51Device[]>([]);
  const [metrics, setMetrics] = useState<FleetMetrics>({
    totalDevices: 0,
    activeDevices: 0,
    movingVehicles: 0,
    parkedDevices: 0,
    offlineVehicles: 0,
    lastUpdate: new Date()
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  const handlePositionUpdate = useCallback((event: CustomEvent) => {
    const { positions: newPositions } = event.detail;
    setPositions(newPositions);
    
    // Update metrics
    const allDevices = devices;
    const newMetrics = gps51LiveDataService.calculateFleetMetrics(newPositions, allDevices);
    setMetrics(newMetrics);
    
    console.log(`📍 Received ${newPositions.length} position updates`);
  }, [devices]);

  const handleDeviceListUpdate = useCallback((event: CustomEvent) => {
    const { groups } = event.detail;
    setDeviceGroups(groups);
    
    // Flatten devices from all groups
    const allDevices = groups.flatMap((group: GPS51DeviceGroup) => group.devices);
    setDevices(allDevices);
    
    console.log(`📱 Received ${allDevices.length} devices in ${groups.length} groups`);
  }, []);

  const handleConnectionLost = useCallback(() => {
    setIsConnected(false);
    setError('GPS51 connection lost');
    console.warn('⚠️ GPS51 connection lost');
  }, []);

  const startLiveTracking = useCallback(async (deviceIds?: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const targetDeviceIds = deviceIds || devices.map(d => d.deviceid);
      
      await gps51LiveDataService.startRealTimePolling(targetDeviceIds);
      setIsLiveTracking(true);
      setIsConnected(true);
      
      console.log('🎯 Live tracking started successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start live tracking';
      setError(errorMessage);
      console.error('❌ Failed to start live tracking:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [devices]);

  const stopLiveTracking = useCallback(() => {
    gps51LiveDataService.stopPolling();
    setIsLiveTracking(false);
    console.log('⏹️ Live tracking stopped');
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch device list
      const groups = await gps51LiveDataService.getDeviceList();
      setDeviceGroups(groups);
      
      const allDevices = groups.flatMap(group => group.devices);
      setDevices(allDevices);
      
      // Fetch latest positions
      const deviceIds = allDevices.map(d => d.deviceid);
      const latestPositions = await gps51LiveDataService.pollLatestPositions(deviceIds);
      setPositions(latestPositions);
      
      // Calculate metrics
      const newMetrics = gps51LiveDataService.calculateFleetMetrics(latestPositions, allDevices);
      setMetrics(newMetrics);
      
      setIsConnected(true);
      console.log('🔄 Data refreshed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      setError(errorMessage);
      setIsConnected(false);
      console.error('❌ Failed to refresh data:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDevicePosition = useCallback((deviceId: string): GPS51Position | null => {
    return positions.find(p => p.deviceid === deviceId) || null;
  }, [positions]);

  const getPosition = useCallback((deviceId: string): GPS51Position | null => {
    return positions.find(p => p.deviceid === deviceId) || null;
  }, [positions]);

  const getDeviceHistory = useCallback(async (deviceId: string, startTime: Date, endTime: Date): Promise<GPS51Position[]> => {
    try {
      return await gps51LiveDataService.getDeviceHistory(deviceId, startTime, endTime);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get device history';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('gps51PositionUpdate', handlePositionUpdate as EventListener);
    window.addEventListener('gps51DeviceListUpdate', handleDeviceListUpdate as EventListener);
    window.addEventListener('gps51ConnectionLost', handleConnectionLost as EventListener);

    return () => {
      window.removeEventListener('gps51PositionUpdate', handlePositionUpdate as EventListener);
      window.removeEventListener('gps51DeviceListUpdate', handleDeviceListUpdate as EventListener);
      window.removeEventListener('gps51ConnectionLost', handleConnectionLost as EventListener);
    };
  }, [handlePositionUpdate, handleDeviceListUpdate, handleConnectionLost]);

  // Auto-refresh data on mount if enabled
  useEffect(() => {
    if (options.enabled !== false) {
      refreshData();
    }
  }, [refreshData, options.enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isLiveTracking) {
        stopLiveTracking();
      }
    };
  }, [isLiveTracking, stopLiveTracking]);

  return {
    positions,
    deviceGroups,
    devices,
    metrics,
    isConnected,
    isLoading,
    error,
    isLiveTracking,
    startLiveTracking,
    stopLiveTracking,
    refreshData,
    getDevicePosition,
    getPosition,
    getDeviceHistory
  };
};
