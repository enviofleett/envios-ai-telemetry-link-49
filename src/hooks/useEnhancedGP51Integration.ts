
import { useState, useEffect, useCallback } from 'react';
import { useRealTimePositions } from './useRealTimePositions';
import { livePositionService } from '@/services/gp51/LivePositionService';
import { unifiedGP51Service } from '@/services/gp51/UnifiedGP51Service';
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

      // Get monitor list from GP51
      const monitorList = await unifiedGP51Service.queryMonitorList();
      
      if (monitorList.status !== 0) {
        throw new Error(monitorList.cause || 'Failed to fetch monitor list');
      }

      // Sync devices to database
      const allDevices = monitorList.groups.flatMap(group => 
        group.devices.map(device => ({
          device_id: device.deviceid,
          device_name: device.devicename,
          device_type: device.devicetype,
          device_data: device,
          group_id: group.groupid,
          group_name: group.groupname,
          status: 'active',
          is_online: device.status === 'online',
          last_active_time: device.lastactivetime ? new Date(device.lastactivetime).toISOString() : null,
          sim_number: device.simnum,
          sync_status: 'synced',
          last_sync: new Date().toISOString()
        }))
      );

      if (allDevices.length > 0) {
        const { error: upsertError } = await supabase
          .from('gp51_devices')
          .upsert(allDevices, { onConflict: 'device_id' });

        if (upsertError) {
          console.error('Error syncing devices:', upsertError);
          throw upsertError;
        }
      }

      // Reload devices from database
      await loadDevicesFromDatabase();

      console.log(`Synced ${allDevices.length} devices from GP51`);
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

  // Update device positions when real-time positions change
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

  // Load devices on mount
  useEffect(() => {
    loadDevicesFromDatabase();
  }, [loadDevicesFromDatabase]);

  return {
    devices,
    positions,
    isConnected,
    isLoading,
    error,
    startTracking,
    stopTracking,
    refreshDevices,
    syncWithGP51
  };
}
