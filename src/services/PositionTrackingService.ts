
export interface PositionUpdate {
  deviceid: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
  status: string;
}

export class PositionTrackingService {
  private isRunning: boolean = false;
  private listeners: Map<string, (update: PositionUpdate) => void> = new Map();
  
  start(deviceIds: string[] = []): void {
    this.isRunning = true;
    console.log('Position tracking started for devices:', deviceIds);
  }

  stop(): void {
    this.isRunning = false;
    console.log('Position tracking stopped');
  }

  subscribe(listenerId: string, callback: (update: PositionUpdate) => void): void {
    this.listeners.set(listenerId, callback);
  }

  unsubscribe(listenerId: string): void {
    this.listeners.delete(listenerId);
  }

  isActive(): boolean {
    return this.isRunning;
  }

  async forceUpdate(): Promise<void> {
    console.log('Forcing position update...');
    // Mock position update
    const mockUpdate: PositionUpdate = {
      deviceid: 'device_001',
      latitude: 52.0 + Math.random() * 0.1,
      longitude: 4.3 + Math.random() * 0.1,
      speed: Math.random() * 100,
      timestamp: Date.now(),
      status: 'moving'
    };

    // Notify all listeners
    this.listeners.forEach(callback => {
      try {
        callback(mockUpdate);
      } catch (error) {
        console.error('Error in position update callback:', error);
      }
    });
  }
}

export const positionTrackingService = new PositionTrackingService();
