
import { useState, useEffect, useCallback } from 'react';
import { realTimePositionService } from '@/services/gp51/index';

export interface PositionUpdate {
  deviceId: string;
  position: {
    deviceid: string;
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
    altitude: number;
    timestamp: string;
    status: string;
  };
  timestamp: Date;
}

export interface UseRealTimePositionsReturn {
  positions: Map<string, PositionUpdate>;
  isSubscribed: boolean;
  error: string | null;
  lastUpdate: Date | null;
  subscribe: (deviceIds: string[]) => void;
  unsubscribe: () => void;
  clearError: () => void;
}

export const useRealTimePositions = (subscriptionId?: string): UseRealTimePositionsReturn => {
  const [positions, setPositions] = useState<Map<string, PositionUpdate>>(new Map());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const actualSubscriptionId = subscriptionId || `subscription-${Date.now()}`;

  const subscribe = useCallback((deviceIds: string[]) => {
    console.log('📡 [useRealTimePositions] Subscribing to devices:', deviceIds);
    
    setIsSubscribed(true);
    setError(null);
    
    realTimePositionService.start(deviceIds);
    
    realTimePositionService.subscribe(actualSubscriptionId, (update) => {
      const positionUpdate: PositionUpdate = {
        deviceId: update.deviceid,
        position: {
          deviceid: update.deviceid,
          latitude: update.latitude,
          longitude: update.longitude,
          speed: update.speed,
          course: update.course || 0,
          altitude: update.altitude || 0,
          timestamp: new Date(update.timestamp).toISOString(),
          status: update.status
        },
        timestamp: new Date()
      };
      
      setPositions(prev => {
        const newPositions = new Map(prev);
        newPositions.set(update.deviceid, positionUpdate);
        return newPositions;
      });
      setLastUpdate(new Date());
    });
  }, [actualSubscriptionId]);

  const unsubscribe = useCallback(() => {
    console.log('📡 [useRealTimePositions] Unsubscribing from real-time positions');
    
    realTimePositionService.stop();
    realTimePositionService.unsubscribe(actualSubscriptionId);
    setIsSubscribed(false);
    setPositions(new Map());
    setLastUpdate(null);
  }, [actualSubscriptionId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSubscribed) {
        realTimePositionService.unsubscribe(actualSubscriptionId);
      }
    };
  }, [actualSubscriptionId, isSubscribed]);

  return {
    positions,
    isSubscribed,
    error,
    lastUpdate,
    subscribe,
    unsubscribe,
    clearError,
  };
};
