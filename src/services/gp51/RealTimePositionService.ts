
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
  updateInterval: number; // milliseconds
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
      updateInterval: 10000, // 10 seconds default
      deviceIds: [],
      autoReconnect: true,
      ...config
    };
  }

  // Start real-time position updates
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
          // Try to reconnect after a delay
          setTimeout(() => {
            if (this.isRunning) {
              this.start(this.config.deviceIds);
            }
          }, 5000);
        }
      }
    }, this.config.updateInterval);

    // Fetch initial positions immediately
    this.fetchAndBroadcastPositions().catch(console.error);
  }

  // Stop real-time updates
  stop(): void {
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Subscribe to position updates for specific devices
  subscribe(listenerId: string, callback: (update: PositionUpdate) => void): void {
    this.listeners.set(listenerId, callback);
  }

  // Unsubscribe from position updates
  unsubscribe(listenerId: string): void {
    this.listeners.delete(listenerId);
  }

  // Add device to tracking list
  addDevice(deviceId: string): void {
    if (!this.config.deviceIds.includes(deviceId)) {
      this.config.deviceIds.push(deviceId);
      
      // Restart tracking if currently running
      if (this.isRunning) {
        this.start(this.config.deviceIds);
      }
    }
  }

  // Remove device from tracking list
  removeDevice(deviceId: string): void {
    const index = this.config.deviceIds.indexOf(deviceId);
    if (index > -1) {
      this.config.deviceIds.splice(index, 1);
      
      // Restart tracking if currently running
      if (this.isRunning) {
        this.start(this.config.deviceIds);
      }
    }
  }

  // Get current configuration
  getConfig(): RealTimePositionConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(newConfig: Partial<RealTimePositionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart if running and interval changed
    if (this.isRunning && newConfig.updateInterval) {
      this.start(this.config.deviceIds);
    }
  }

  // Check if service is running
  isActive(): boolean {
    return this.isRunning;
  }

  // Get tracked device IDs
  getTrackedDevices(): string[] {
    return [...this.config.deviceIds];
  }

  // Private method to fetch and broadcast positions
  private async fetchAndBroadcastPositions(): Promise<void> {
    try {
      if (this.config.deviceIds.length === 0) {
        return;
      }

      // Fetch latest positions from GP51
      const positions = await this.gp51Service.getLastPosition(this.config.deviceIds);
      
      if (!positions || positions.length === 0) {
        return;
      }

      // Process and broadcast each position update
      for (const position of positions) {
        if (this.isValidPosition(position)) {
          const update: PositionUpdate = this.transformPosition(position);
          this.broadcastUpdate(update);
        }
      }

      // Update last position time
      this.lastPositionTime = Date.now();
      
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      throw error;
    }
  }

  // Validate position data
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

  // Transform GP51 position data to standardized format
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

  // Broadcast position update to all listeners
  private broadcastUpdate(update: PositionUpdate): void {
    this.listeners.forEach((callback, listenerId) => {
      try {
        callback(update);
      } catch (error) {
        console.error(`Error in position update listener ${listenerId}:`, error);
      }
    });
  }

  // Get last position time
  getLastUpdateTime(): number {
    return this.lastPositionTime;
  }

  // Force immediate position update
  async forceUpdate(): Promise<void> {
    if (this.config.deviceIds.length > 0) {
      await this.fetchAndBroadcastPositions();
    }
  }
}

// Export singleton instance
export const realTimePositionService = new RealTimePositionService();
