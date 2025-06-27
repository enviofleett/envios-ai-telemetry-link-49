
import { useState, useEffect } from 'react';
import type {
  GP51HealthStatus,
  GP51Device as GP51DeviceData,
  GP51Position,
  GP51PerformanceMetrics
} from '@/types/gp51-unified';
import { GP51PropertyMapper } from '@/types/gp51-unified';

export const useUnifiedGP51Service = () => {
  const [healthStatus, setHealthStatus] = useState<GP51HealthStatus | null>(null);
  const [devices, setDevices] = useState<GP51DeviceData[]>([]);
  const [positions, setPositions] = useState<GP51Position[]>([]);
  const [metrics, setMetrics] = useState<GP51PerformanceMetrics | null>(null);

  const processPositions = (rawPositions: GP51Position[]) => {
    return rawPositions.map(pos => {
      const enhanced = GP51PropertyMapper.enhancePosition(pos);
      // Use deviceid (original property) instead of deviceId
      console.log(`Processing position for device: ${enhanced.deviceid}`);
      return enhanced;
    });
  };

  return {
    healthStatus,
    devices,
    positions,
    metrics,
    processPositions
  };
};
