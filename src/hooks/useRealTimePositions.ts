
import { useState, useEffect } from 'react';
import { realTimePositionService } from '@/services/gp51/realTimePositionService';

interface PositionUpdate {
  deviceid: string;
  devicetime: number;
  arrivedtime: number;
  updatetime: number;
  validpoistiontime: number;
  callat: number;
  callon: number;
  altitude: number;
  radius: number;
  speed: number;
  course: number;
  totaldistance: number;
  status: number;
  strstatus: string;
  strstatusen: string;
  alarm: number;
  stralarm: string;
  gotsrc: string;
  rxlevel: number;
  gpsvalidnum: number;
  moving: number;
  parktime: number;
  parkduration: number;
}

export const useRealTimePositions = () => {
  const [positions, setPositions] = useState<PositionUpdate[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPolling = async () => {
    try {
      setError(null);
      const result = await realTimePositionService.startPolling();
      
      if (result.success) {
        setIsPolling(true);
      } else {
        setError(result.error || 'Failed to start polling');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const stopPolling = () => {
    realTimePositionService.stopPolling();
    setIsPolling(false);
  };

  useEffect(() => {
    // Subscribe to position updates
    const unsubscribe = realTimePositionService.onPositionUpdate((newPosition) => {
      // Convert the position update to the expected format
      const convertedPosition: PositionUpdate = {
        deviceid: newPosition.deviceId,
        devicetime: newPosition.position.timestamp.getTime(),
        arrivedtime: Date.now(),
        updatetime: Date.now(),
        validpoistiontime: newPosition.position.timestamp.getTime(),
        callat: newPosition.position.latitude,
        callon: newPosition.position.longitude,
        altitude: 0,
        radius: 0,
        speed: newPosition.position.speed || 0,
        course: newPosition.position.heading || 0,
        totaldistance: 0,
        status: 1,
        strstatus: 'Active',
        strstatusen: 'Active',
        alarm: 0,
        stralarm: 'None',
        gotsrc: 'GPS',
        rxlevel: 0,
        gpsvalidnum: 1,
        moving: newPosition.position.speed && newPosition.position.speed > 0 ? 1 : 0,
        parktime: 0,
        parkduration: 0
      };
      
      setPositions(prev => {
        const filtered = prev.filter(p => p.deviceid !== convertedPosition.deviceid);
        return [...filtered, convertedPosition];
      });
    });

    // Check if already polling
    setIsPolling(realTimePositionService.isCurrentlyPolling());

    return () => {
      unsubscribe();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPolling) {
        realTimePositionService.stopPolling();
      }
    };
  }, []);

  const getDevicePosition = (deviceId: string) => {
    return realTimePositionService.getDeviceLastPosition(deviceId);
  };

  return {
    positions,
    isPolling,
    error,
    startPolling,
    stopPolling,
    getDevicePosition
  };
};
