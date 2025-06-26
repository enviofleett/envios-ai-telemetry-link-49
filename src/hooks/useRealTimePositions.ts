import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RealTimePosition {
  deviceId: string;
  position: {
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
    timestamp: Date;
    isMoving: boolean;
  };
  lastUpdate: Date;
}

export interface UseRealTimePositionsReturn {
  positions: Map<string, RealTimePosition>;
  subscribe: (deviceIds: string[]) => void;
  unsubscribe: () => void;
  isConnected: boolean;
  error: string | null;
}

export function useRealTimePositions(): UseRealTimePositionsReturn {
  const [positions, setPositions] = useState<Map<string, RealTimePosition>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedDevicesRef = useRef<string[]>([]);

  const subscribe = useCallback(async (deviceIds: string[]) => {
    try {
      // Clean up existing subscription
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      subscribedDevicesRef.current = deviceIds;
      
      // Create new channel for live positions
      const channel = supabase
        .channel('live_positions_tracking')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'live_positions',
            filter: `device_id=in.(${deviceIds.join(',')})`
          },
          (payload) => {
            console.log('Real-time position update:', payload);
            
            if (payload.new && typeof payload.new === 'object') {
              const positionData = payload.new as any;
              
              const position: RealTimePosition = {
                deviceId: positionData.device_id,
                position: {
                  latitude: positionData.latitude,
                  longitude: positionData.longitude,
                  speed: positionData.speed || 0,
                  course: positionData.course || 0,
                  timestamp: new Date(positionData.position_timestamp),
                  isMoving: positionData.is_moving || false
                },
                lastUpdate: new Date()
              };

              setPositions(prev => {
                const newPositions = new Map(prev);
                newPositions.set(positionData.device_id, position);
                return newPositions;
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
          if (status === 'CLOSED') {
            setError('Connection closed unexpectedly');
          } else if (status === 'CHANNEL_ERROR') {
            setError('Channel error occurred');
          } else {
            setError(null);
          }
        });

      channelRef.current = channel;

      // Load initial positions for subscribed devices
      const { data: initialPositions, error: fetchError } = await supabase
        .from('live_positions')
        .select('*')
        .in('device_id', deviceIds)
        .order('position_timestamp', { ascending: false });

      if (fetchError) {
        console.error('Error fetching initial positions:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (initialPositions) {
        const positionsMap = new Map<string, RealTimePosition>();
        
        // Group by device_id and keep only the latest position for each device
        const latestPositions = new Map();
        initialPositions.forEach(pos => {
          const existing = latestPositions.get(pos.device_id);
          if (!existing || new Date(pos.position_timestamp) > new Date(existing.position_timestamp)) {
            latestPositions.set(pos.device_id, pos);
          }
        });

        latestPositions.forEach(positionData => {
          const position: RealTimePosition = {
            deviceId: positionData.device_id,
            position: {
              latitude: positionData.latitude,
              longitude: positionData.longitude,
              speed: positionData.speed || 0,
              course: positionData.course || 0,
              timestamp: new Date(positionData.position_timestamp),
              isMoving: positionData.is_moving || false
            },
            lastUpdate: new Date()
          };
          positionsMap.set(positionData.device_id, position);
        });

        setPositions(positionsMap);
      }

    } catch (err) {
      console.error('Error subscribing to real-time positions:', err);
      setError(err instanceof Error ? err.message : 'Subscription failed');
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setPositions(new Map());
      setIsConnected(false);
      setError(null);
      subscribedDevicesRef.current = [];
    } catch (err) {
      console.error('Error unsubscribing:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    positions,
    subscribe,
    unsubscribe,
    isConnected,
    error
  };
}
