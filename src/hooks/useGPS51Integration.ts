import { useState, useEffect, useCallback } from 'react';
import { useRealTimePositions } from './useRealTimePositions';
import { livePositionService } from '@/services/gp51/LivePositionService';
import { unifiedGP51Service } from '@/services/gp51/UnifiedGP51Service';
import { gps51ProductionService } from '@/services/gp51/GPS51ProductionService';
import { supabase } from '@/integrations/supabase/client';

export interface GP51DeviceStatus {
  deviceId: string;
  deviceName: string;
  isOnline: boolean;
  lastSeen: Date;
  position?: {
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
    timestamp: Date;
  };
}

export interface UseEnhancedGP51IntegrationReturn {
  devices: GP51DeviceStatus[];
  positions: Map<string, any>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  refreshDevices: () => Promise<void>;
  syncWithGP51: () => Promise<void>;
  authenticateWithGP51: (username: string, password: string) => Promise<boolean>;
}

export function useEnhancedGP51Integration(): UseEnhancedGP51IntegrationReturn {
  const [devices, setDevices] = useState<GP51DeviceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const { 
    positions, 
    subscribe, 
    unsubscribe, 
    isConnected 
  } = useRealTimePositions();

  const authenticateWithGP51 = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔐 Authenticating with GP51 as: ${username}`);
      
      const response = await unifiedGP51Service.authenticate(username, password);
      
      if (response.status === 0) {
        console.log('✅ GP51 authentication successful');
        return true;
      } else {
        const errorMsg = response.cause || 'Authentication failed';
        console.error('❌ GP51 authentication failed:', errorMsg);
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication error';
      console.error('❌ GP51 authentication error:', errorMsg);
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDevicesFromDatabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gp51_devices')
        .select(`
          device_id,
          device_name,
          is_online,
          last_active_time,
          status
        `)
        .eq('status', 'active');

      if (error) {
        console.error('Error loading devices from database:', error);
        throw error;
      }

      const deviceStatuses: GP51DeviceStatus[] = (data || []).map(device => ({
        deviceId: device.device_id,
        deviceName: device.device_name,
        isOnline: device.is_online || false,
        lastSeen: device.last_active_time ? new Date(device.last_active_time) : new Date()
      }));

      setDevices(deviceStatuses);
      return deviceStatuses;
    } catch (err) {
      console.error('Error loading devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load devices');
      return [];
    }
  }, []);

  const syncWithGP51 = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!unifiedGP51Service.isAuthenticated) {
        throw new Error('Not authenticated with GP51. Please authenticate first.');
      }

      console.log('🔄 Syncing devices from GP51...');

      const monitorResponse = await unifiedGP51Service.queryMonitorList();
      
      if (!monitorResponse.success) {
        throw new Error(monitorResponse.error || 'Failed to fetch monitor list');
      }

      await loadDevicesFromDatabase();

      console.log(`✅ GP51 sync completed`);
    } catch (err) {
      console.error('Error syncing with GP51:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsLoading(false);
    }
  }, [loadDevicesFromDatabase]);

  const startTracking = useCallback(async () => {
    try {
      if (devices.length === 0) {
        await loadDevicesFromDatabase();
      }

      const deviceIds = devices.map(d => d.deviceId);
      if (deviceIds.length > 0) {
        if (unifiedGP51Service.isAuthenticated) {
          console.log('🎯 Starting real-time position tracking...');
          
          const positionsResponse = await unifiedGP51Service.getPositions(deviceIds);
          
          if (Array.isArray(positionsResponse) && positionsResponse.length > 0) {
            console.log(`📍 Retrieved positions for ${positionsResponse.length} devices`);
          }
        }

        await subscribe(deviceIds);
        setIsTracking(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error starting tracking:', err);
      setError(err instanceof Error ? err.message : 'Failed to start tracking');
    }
  }, [devices, subscribe, loadDevicesFromDatabase]);

  const stopTracking = useCallback(() => {
    unsubscribe();
    setIsTracking(false);
  }, [unsubscribe]);

  const refreshDevices = useCallback(async () => {
    await loadDevicesFromDatabase();
  }, [loadDevicesFromDatabase]);

  useEffect(() => {
    if (positions.size > 0) {
      setDevices(prevDevices => 
        prevDevices.map(device => {
          const positionUpdate = positions.get(device.deviceId);
          if (positionUpdate) {
            return {
              ...device,
              position: positionUpdate.position,
              isOnline: true,
              lastSeen: positionUpdate.lastUpdate
            };
          }
          return device;
        })
      );
    }
  }, [positions]);

  useEffect(() => {
    loadDevicesFromDatabase();
  }, [loadDevicesFromDatabase]);

  useEffect(() => {
    const loadExistingSession = async () => {
      try {
        const service = unifiedGP51Service;
        const sessionLoaded = await service.loadExistingSession();
        if (sessionLoaded) {
          console.log('✅ Loaded existing GP51 session');
          await loadDevicesFromDatabase();
        }
      } catch (err) {
        console.log('ℹ️ No existing GP51 session found');
      }
    };

    loadExistingSession();
  }, [loadDevicesFromDatabase]);

  return {
    devices,
    positions,
    isConnected: isConnected && unifiedGP51Service.isAuthenticated,
    isLoading,
    error,
    startTracking,
    stopTracking,
    refreshDevices,
    syncWithGP51,
    authenticateWithGP51
  };
}
