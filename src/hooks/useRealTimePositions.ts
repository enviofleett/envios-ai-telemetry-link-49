
import { useState, useEffect, useCallback } from 'react';
import { realTimePositionService, PositionUpdate } from '@/services/gp51/RealTimePositionService';

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
    
    realTimePositionService.subscribe(actualSubscriptionId, {
      deviceIds,
      onUpdate: (update: PositionUpdate) => {
        setPositions(prev => {
          const newPositions = new Map(prev);
          newPositions.set(update.deviceId, update);
          return newPositions;
        });
        setLastUpdate(new Date());
      },
      onError: (errorMessage: string) => {
        console.error('❌ [useRealTimePositions] Position update error:', errorMessage);
        setError(errorMessage);
      }
    });
  }, [actualSubscriptionId]);

  const unsubscribe = useCallback(() => {
    console.log('📡 [useRealTimePositions] Unsubscribing from real-time positions');
    
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
