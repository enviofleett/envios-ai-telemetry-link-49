
import { UnifiedGP51Service, unifiedGP51Service } from './UnifiedGP51Service';

export interface PositionUpdate {
  deviceid: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
  status: string;
  altitude?: number;
  course?: number;
}

export interface RealTimePositionConfig {
  updateInterval: number;
  deviceIds: string[];
  autoReconnect: boolean;
}

export class RealTimePositionService {
  private updateInterval: NodeJS.Timeout | null = null;
  private config: RealTimePositionConfig;
  private listeners: Map<string, (update: PositionUpdate) => void> = new Map();
  private lastPositionTime: number = 0;
  private isRunning: boolean = false;
  
  constructor(
    private gp51Service: UnifiedGP51Service = unifiedGP51Service,
    config: Partial<RealTimePositionConfig> = {}
  ) {
    this.config = {
      updateInterval: 10000,
      deviceIds: [],
      autoReconnect: true,
      ...config
    };
  }

  start(deviceIds: string[] = []): void {
    if (this.isRunning) {
      this.stop();
    }

    this.config.deviceIds = deviceIds.length > 0 ? deviceIds : this.config.deviceIds;
    this.isRunning = true;

    if (this.config.deviceIds.length === 0) {
      console.warn('No device IDs provided for real-time tracking');
      return;
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.fetchAndBroadcastPositions();
      } catch (error) {
        console.error('Real-time position update failed:', error);
        
        if (this.config.autoReconnect) {
          setTimeout(() => {
            if (this.isRunning) {
              this.start(this.config.deviceIds);
            }
          }, 5000);
        }
      }
    }, this.config.updateInterval);

    this.fetchAndBroadcastPositions().catch(console.error);
  }

  stop(): void {
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  subscribe(listenerId: string, callback: (update: PositionUpdate) => void): void {
    this.listeners.set(listenerId, callback);
  }

  unsubscribe(listenerId: string): void {
    this.listeners.delete(listenerId);
  }

  addDevice(deviceId: string): void {
    if (!this.config.deviceIds.includes(deviceId)) {
      this.config.deviceIds.push(deviceId);
      
      if (this.isRunning) {
        this.start(this.config.deviceIds);
      }
    }
  }

  removeDevice(deviceId: string): void {
    const index = this.config.deviceIds.indexOf(deviceId);
    if (index > -1) {
      this.config.deviceIds.splice(index, 1);
      
      if (this.isRunning) {
        this.start(this.config.deviceIds);
      }
    }
  }

  getConfig(): RealTimePositionConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<RealTimePositionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isRunning && newConfig.updateInterval) {
      this.start(this.config.deviceIds);
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getTrackedDevices(): string[] {
    return [...this.config.deviceIds];
  }

  private async fetchAndBroadcastPositions(): Promise<void> {
    try {
      if (this.config.deviceIds.length === 0) {
        return;
      }

      const positions = await this.gp51Service.getLastPosition(this.config.deviceIds);
      
      if (!positions || positions.length === 0) {
        return;
      }

      for (const position of positions) {
        if (this.isValidPosition(position)) {
          const update: PositionUpdate = this.transformPosition(position);
          this.broadcastUpdate(update);
        }
      }

      this.lastPositionTime = Date.now();
      
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      throw error;
    }
  }

  private isValidPosition(position: any): boolean {
    return (
      position &&
      typeof position.deviceid === 'string' &&
      typeof position.callat === 'number' &&
      typeof position.callon === 'number' &&
      position.callat !== 0 &&
      position.callon !== 0
    );
  }

  private transformPosition(position: any): PositionUpdate {
    return {
      deviceid: position.deviceid,
      latitude: position.callat || position.lat,
      longitude: position.callon || position.lon,
      speed: position.speed || 0,
      timestamp: position.updatetime || position.arrivedtime || Date.now(),
      status: position.strstatus || 'unknown',
      altitude: position.altitude,
      course: position.course
    };
  }

  private broadcastUpdate(update: PositionUpdate): void {
    this.listeners.forEach((callback, listenerId) => {
      try {
        callback(update);
      } catch (error) {
        console.error(`Error in position update listener ${listenerId}:`, error);
      }
    });
  }

  getLastUpdateTime(): number {
    return this.lastPositionTime;
  }

  async forceUpdate(): Promise<void> {
    if (this.config.deviceIds.length > 0) {
      await this.fetchAndBroadcastPositions();
    }
  }
}

export const realTimePositionService = new RealTimePositionService();
