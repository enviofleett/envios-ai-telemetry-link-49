
import { gp51DataService } from './GP51DataService';
import type { GP51Device, GP51Position } from '@/types/gp51-unified';

export class GP51UnifiedDataService {
  async getDevices(): Promise<GP51Device[]> {
    try {
      const result = await gp51DataService.queryMonitorList();
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get devices:', error);
      return [];
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      return await gp51DataService.getPositions(deviceIds);
    } catch (error) {
      console.error('Failed to get positions:', error);
      return [];
    }
  }

  async processVehicleData(devices: GP51Device[], positions: GP51Position[]) {
    // Create device position map
    const positionMap = new Map<string, GP51Position>();
    positions.forEach(pos => {
      positionMap.set(pos.deviceid, pos);
    });

    // Process each device
    return devices.map(device => {
      const position = positionMap.get(device.deviceid);
      
      return {
        device,
        position,
        // Fixed comparison: use explicit comparison instead of boolean vs number
        isOnline: device.isOnline === true,
        hasPosition: position !== undefined,
        lastUpdate: position?.updatetime || device.lastactivetime
      };
    });
  }
}

export const gp51UnifiedDataService = new GP51UnifiedDataService();
