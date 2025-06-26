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

export class RealTimePositionService {
  private static instance: RealTimePositionService;
  private subscriptions: Map<string, RealTimeSubscription> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLLING_INTERVAL_MS = 5000;

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
}

export const realTimePositionService = RealTimePositionService.getInstance();
