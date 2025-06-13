
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LiveVehicleData {
  speed: number;
  status: 'online' | 'offline' | 'moving';
  lastUpdate: Date;
  position?: {
    lat: number;
    lng: number;
  };
}

interface UseLiveVehicleDataOptions {
  deviceId?: string;
  deviceIds?: string[];
  pollingInterval?: number;
  enabled?: boolean;
}

export const useLiveVehicleData = (options: UseLiveVehicleDataOptions = {}) => {
  const {
    deviceId,
    deviceIds,
    pollingInterval = 30000, // 30 seconds
    enabled = true
  } = options;

  const [liveData, setLiveData] = useState<Record<string, LiveVehicleData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Record<string, { data: LiveVehicleData; timestamp: number }>>({});

  const fetchLiveData = async (ids: string[]) => {
    if (!enabled || ids.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first (2-second cache)
      const now = Date.now();
      const cachedResults: Record<string, LiveVehicleData> = {};
      const uncachedIds: string[] = [];

      ids.forEach(id => {
        const cached = cacheRef.current[id];
        if (cached && (now - cached.timestamp) < 2000) {
          cachedResults[id] = cached.data;
        } else {
          uncachedIds.push(id);
        }
      });

      if (uncachedIds.length === 0) {
        setLiveData(prev => ({ ...prev, ...cachedResults }));
        setIsLoading(false);
        return;
      }

      // Fetch live data from GP51 via edge function
      const { data, error: fetchError } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: { deviceIds: uncachedIds }
      });

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch live data');
      }

      if (data && data.success && data.data) {
        const newLiveData: Record<string, LiveVehicleData> = {};
        
        // Process telemetry data
        if (data.data.telemetry && Array.isArray(data.data.telemetry)) {
          data.data.telemetry.forEach((telem: any) => {
            const deviceId = telem.device_id;
            const speed = telem.speed || 0;
            const lastUpdate = new Date(telem.timestamp);
            
            // Determine status based on data recency and movement
            const minutesOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
            let status: 'online' | 'offline' | 'moving' = 'offline';
            
            if (minutesOld <= 5) {
              status = speed > 0 ? 'moving' : 'online';
            }

            const liveVehicleData: LiveVehicleData = {
              speed,
              status,
              lastUpdate,
              position: {
                lat: telem.latitude,
                lng: telem.longitude
              }
            };

            newLiveData[deviceId] = liveVehicleData;
            
            // Update cache
            cacheRef.current[deviceId] = {
              data: liveVehicleData,
              timestamp: now
            };
          });
        }

        // Handle devices with no telemetry (offline)
        uncachedIds.forEach(id => {
          if (!newLiveData[id]) {
            const offlineData: LiveVehicleData = {
              speed: 0,
              status: 'offline',
              lastUpdate: new Date()
            };
            newLiveData[id] = offlineData;
            cacheRef.current[id] = {
              data: offlineData,
              timestamp: now
            };
          }
        });

        setLiveData(prev => ({ ...prev, ...cachedResults, ...newLiveData }));
      }
    } catch (err) {
      console.error('Live data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const targetIds = deviceIds || (deviceId ? [deviceId] : []);
    if (targetIds.length === 0) return;

    // Initial fetch
    fetchLiveData(targetIds);

    // Set up polling
    intervalRef.current = setInterval(() => {
      fetchLiveData(targetIds);
    }, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [deviceId, deviceIds, pollingInterval, enabled]);

  const refreshData = () => {
    const targetIds = deviceIds || (deviceId ? [deviceId] : []);
    fetchLiveData(targetIds);
  };

  const getLiveDataForDevice = (id: string): LiveVehicleData | undefined => {
    return liveData[id];
  };

  return {
    liveData,
    isLoading,
    error,
    refreshData,
    getLiveDataForDevice
  };
};
