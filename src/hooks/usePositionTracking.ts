
import { useState, useCallback, useEffect, useRef } from 'react';
import { PositionUpdate, positionTrackingService } from '@/services/PositionTrackingService';

export interface UsePositionTrackingReturn {
  positions: Map<string, PositionUpdate>;
  isTracking: boolean;
  lastUpdate: number;
  error: string | null;
  startTracking: (deviceIds: string[]) => void;
  stopTracking: () => void;
  forceUpdate: () => Promise<void>;
}

export function usePositionTracking(): UsePositionTrackingReturn {
  const [positions, setPositions] = useState<Map<string, PositionUpdate>>(new Map());
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const listenerIdRef = useRef(`position_${Date.now()}_${Math.random()}`);

  useEffect(() => {
    const listenerId = listenerIdRef.current;
    
    // Subscribe to position updates
    positionTrackingService.subscribe(listenerId, (update: PositionUpdate) => {
      setPositions(prev => {
        const newPositions = new Map(prev);
        newPositions.set(update.deviceid, update);
        return newPositions;
      });
      setLastUpdate(Date.now());
    });

    // Update tracking status
    setIsTracking(positionTrackingService.isActive());

    // Cleanup on unmount
    return () => {
      positionTrackingService.unsubscribe(listenerId);
    };
  }, []);

  const startTracking = useCallback((deviceIds: string[]) => {
    try {
      positionTrackingService.start(deviceIds);
      setIsTracking(true);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start tracking';
      setError(errorMsg);
    }
  }, []);

  const stopTracking = useCallback(() => {
    try {
      positionTrackingService.stop();
      setIsTracking(false);
      setPositions(new Map());
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stop tracking';
      setError(errorMsg);
    }
  }, []);

  const forceUpdate = useCallback(async () => {
    try {
      await positionTrackingService.forceUpdate();
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to force update';
      setError(errorMsg);
    }
  }, []);

  return {
    positions,
    isTracking,
    lastUpdate,
    error,
    startTracking,
    stopTracking,
    forceUpdate
  };
}
