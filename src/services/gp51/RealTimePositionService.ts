import { unifiedGP51Service } from './UnifiedGP51Service';

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

export interface RealTimeSubscription {
  deviceIds: string[];
  onUpdate: (update: PositionUpdate) => void;
  onError: (error: string) => void;
}

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
  private static instance: RealTimePositionService;
  private subscriptions: Map<string, RealTimeSubscription> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLLING_INTERVAL_MS = 5000;
  private updateInterval: NodeJS.Timeout | null = null;
  private config: RealTimePositionConfig;
  private listeners: Map<string, (update: PositionUpdate) => void> = new Map();
  private lastPositionTime: number = 0;
  private isRunning: boolean = false;

  private constructor() {}

  static getInstance(): RealTimePositionService {
    if (!RealTimePositionService.instance) {
      RealTimePositionService.instance = new RealTimePositionService();
    }
    return RealTimePositionService.instance;
  }

  subscribe(subscriptionId: string, subscription: RealTimeSubscription): void {
    console.log('📡 [RealTime] Adding subscription:', subscriptionId, 'for', subscription.deviceIds.length, 'devices');
    
    this.subscriptions.set(subscriptionId, subscription);
    
    if (this.subscriptions.size === 1) {
      this.startPolling();
    }
  }

  unsubscribe(subscriptionId: string): void {
    console.log('📡 [RealTime] Removing subscription:', subscriptionId);
    
    this.subscriptions.delete(subscriptionId);
    
    if (this.subscriptions.size === 0) {
      this.stopPolling();
    }
  }

  private startPolling(): void {
    console.log('🔄 [RealTime] Starting position polling...');
    
    this.pollingInterval = setInterval(async () => {
      await this.pollPositions();
    }, this.POLLING_INTERVAL_MS);

    this.pollPositions();
  }

  private stopPolling(): void {
    console.log('⏸️ [RealTime] Stopping position polling...');
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async pollPositions(): Promise<void> {
    try {
      const allDeviceIds = new Set<string>();
      
      for (const subscription of this.subscriptions.values()) {
        subscription.deviceIds.forEach(deviceId => allDeviceIds.add(deviceId));
      }

      if (allDeviceIds.size === 0) return;

      const result = await unifiedGP51Service.getLastPosition(Array.from(allDeviceIds));
      
      if (!result) {
        console.error('❌ [RealTime] Failed to fetch positions: No data returned');
        this.notifyError('Failed to fetch positions');
        return;
      }

      const positions = Array.isArray(result) ? result : [];
      const now = new Date();

      positions.forEach((positionData: any) => {
        const deviceId = positionData.deviceid;
        
        const position = {
          deviceid: deviceId,
          latitude: positionData.callat || 0,
          longitude: positionData.callon || 0,
          speed: positionData.speed || 0,
          course: positionData.course || 0,
          altitude: positionData.altitude || 0,
          timestamp: new Date(positionData.validpoistiontime || positionData.arrivedtime || now).toISOString(),
          status: positionData.strstatus || positionData.strstatusen || 'Unknown'
        };

        const update: PositionUpdate = {
          deviceId,
          position,
          timestamp: now
        };

        this.subscriptions.forEach((subscription) => {
          if (subscription.deviceIds.includes(deviceId)) {
            try {
              subscription.onUpdate(update);
            } catch (error) {
              console.error('❌ [RealTime] Error in subscription callback:', error);
            }
          }
        });
      });

    } catch (error) {
      console.error('❌ [RealTime] Polling error:', error);
      this.notifyError(error instanceof Error ? error.message : 'Polling error');
    }
  }

  private notifyError(errorMessage: string): void {
    this.subscriptions.forEach((subscription) => {
      try {
        subscription.onError(errorMessage);
      } catch (error) {
        console.error('❌ [RealTime] Error in error callback:', error);
      }
    });
  }

  getStatus(): { 
    isActive: boolean; 
    subscriptionCount: number; 
    totalDevices: number 
  } {
    const allDeviceIds = new Set<string>();
    
    for (const subscription of this.subscriptions.values()) {
      subscription.deviceIds.forEach(deviceId => allDeviceIds.add(deviceId));
    }

    return {
      isActive: this.pollingInterval !== null,
      subscriptionCount: this.subscriptions.size,
      totalDevices: allDeviceIds.size
    };
  }
  
  constructor(
    private gp51Service: any = null,
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

  private async fetchAndBroadcastPositions(): Promise<void> {
    // Mock implementation for now
    console.log('Fetching positions for devices:', this.config.deviceIds);
    
    // Simulate position updates
    this.config.deviceIds.forEach(deviceId => {
      const mockUpdate: PositionUpdate = {
        deviceid: deviceId,
        latitude: Math.random() * 90,
        longitude: Math.random() * 180,
        speed: Math.random() * 100,
        timestamp: Date.now(),
        status: 'active',
        altitude: Math.random() * 1000,
        course: Math.random() * 360
      };
      
      this.broadcastUpdate(mockUpdate);
    });
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

  isActive(): boolean {
    return this.isRunning;
  }

  getTrackedDevices(): string[] {
    return [...this.config.deviceIds];
  }
}

export const realTimePositionService = RealTimePositionService.getInstance();
