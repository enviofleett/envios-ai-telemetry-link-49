
import { useState, useEffect, useCallback } from 'react';
import { realTimePositionService, type PositionUpdate } from '@/services/gp51/RealTimePositionService';

export interface RealTimePositionData {
  position: {
    latitude: number;
    longitude: number;
    speed: number;
    timestamp: number;
    course?: number;
    altitude?: number;
  };
  lastUpdate: Date;
}

export const useRealTimePositions = () => {
  const [positions, setPositions] = useState<Map<string, RealTimePositionData>>(new Map());
  const [isActive, setIsActive] = useState(false);

  const subscribe = useCallback((deviceIds: string[]) => {
    const listenerId = `realtime-${Date.now()}`;
    
    realTimePositionService.subscribe(listenerId, (update: PositionUpdate) => {
      setPositions(prev => {
        const newPositions = new Map(prev);
        newPositions.set(update.deviceid, {
          position: {
            latitude: update.latitude,
            longitude: update.longitude,
            speed: update.speed,
            timestamp: update.timestamp,
            course: update.course,
            altitude: update.altitude
          },
          lastUpdate: new Date()
        });
        return newPositions;
      });
    });

    realTimePositionService.start(deviceIds);
    setIsActive(true);

    return () => {
      realTimePositionService.unsubscribe(listenerId);
    };
  }, []);

  const unsubscribe = useCallback(() => {
    realTimePositionService.stop();
    setIsActive(false);
    setPositions(new Map());
  }, []);

  useEffect(() => {
    return () => {
      realTimePositionService.stop();
    };
  }, []);

  return {
    positions,
    isActive,
    subscribe,
    unsubscribe,
    forceUpdate: () => realTimePositionService.forceUpdate()
  };
};
