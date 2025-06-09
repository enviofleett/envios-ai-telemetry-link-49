
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
    const unsubscribe = realTimePositionService.onPositionUpdate((newPositions) => {
      setPositions(newPositions);
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

  return {
    positions,
    isPolling,
    error,
    startPolling,
    stopPolling,
    getDevicePosition: realTimePositionService.getDeviceLastPosition.bind(realTimePositionService)
  };
};
