
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
  updateInterval?: number;
  timeout?: number;
}

export class RealTimePositionService {
  private isRunning: boolean = false;
  private listeners: Map<string, (update: PositionUpdate) => void> = new Map();
  
  start(deviceIds: string[] = []): void {
    this.isRunning = true;
    console.log('Real-time position service started for devices:', deviceIds);
  }

  stop(): void {
    this.isRunning = false;
    this.listeners.clear();
    console.log('Real-time position service stopped');
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
    // Mock implementation for development
  }
}

export const realTimePositionService = new RealTimePositionService();
