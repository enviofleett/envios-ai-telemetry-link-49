
import { gps51SessionManager } from './GPS51SessionManager';

export interface GPS51Position {
  deviceid: string;
  devicename?: string;
  callat: number;
  callon: number;
  speed: number;
  course: number;
  updatetime: number;
  address?: string;
  status: number;
  moving: number;
  altitude?: number;
  gpstime: number;
}

export interface GPS51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum: string;
  lastactivetime: number;
  isfree: number;
  groupname: string;
}

export interface GPS51DeviceGroup {
  groupname: string;
  devices: GPS51Device[];
}

export class GPS51LiveDataService {
  private static instance: GPS51LiveDataService;
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLLING_INTERVAL = 30000; // 30 seconds
  private lastQueryTime = 0;
  private isPolling = false;

  static getInstance(): GPS51LiveDataService {
    if (!GPS51LiveDataService.instance) {
      GPS51LiveDataService.instance = new GPS51LiveDataService();
    }
    return GPS51LiveDataService.instance;
  }

  async startRealTimePolling(deviceIds: string[] = []): Promise<void> {
    console.log('🚀 Starting GPS51 real-time polling...');
    
    // Stop any existing polling
    this.stopPolling();

    // Validate session first
    if (!await gps51SessionManager.validateSession()) {
      throw new Error('No valid GPS51 session for polling');
    }

    this.isPolling = true;

    // Start polling loop
    this.pollingInterval = setInterval(async () => {
      if (!this.isPolling) return;
      
      try {
        await this.pollLatestPositions(deviceIds);
      } catch (error) {
        console.error('❌ Polling error:', error);
        
        // Try to re-establish session on error
        const sessionValid = await gps51SessionManager.validateSession();
        if (!sessionValid) {
          console.warn('⚠️ Session invalid, stopping polling');
          this.stopPolling();
          this.emitConnectionLost();
        }
      }
    }, this.POLLING_INTERVAL);

    // Initial fetch
    try {
      await this.pollLatestPositions(deviceIds);
      console.log('✅ Real-time polling started successfully');
    } catch (error) {
      console.error('❌ Initial position fetch failed:', error);
      this.stopPolling();
      throw error;
    }
  }

  stopPolling(): void {
    console.log('⏹️ Stopping GPS51 polling...');
    
    this.isPolling = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  async pollLatestPositions(deviceIds: string[] = []): Promise<GPS51Position[]> {
    try {
      const requestBody: any = {
        lastquerypositiontime: this.lastQueryTime
      };

      if (deviceIds.length > 0) {
        requestBody.deviceids = deviceIds;
      }

      const response = await gps51SessionManager.makeAuthenticatedRequest('lastposition', requestBody);

      if (response.status === 0) {
        this.lastQueryTime = response.lastquerypositiontime || Date.now();
        
        const positions = response.records || [];
        
        // Emit real-time updates
        this.emitPositionUpdates(positions);
        
        console.log(`📍 Fetched ${positions.length} position updates`);
        return positions;
      }
      
      throw new Error(response.cause || 'Failed to fetch positions');
    } catch (error) {
      console.error('❌ Failed to poll positions:', error);
      throw error;
    }
  }

  async getDeviceList(): Promise<GPS51DeviceGroup[]> {
    try {
      console.log('📱 Fetching GPS51 device list...');
      
      const session = gps51SessionManager.getSession();
      if (!session) {
        throw new Error('No active GPS51 session');
      }

      const response = await gps51SessionManager.makeAuthenticatedRequest('querymonitorlist', {
        username: session.username
      });

      if (response.status === 0) {
        const groups = response.groups || [];
        
        // Emit device list update
        this.emitDeviceListUpdate(groups);
        
        console.log(`📱 Retrieved ${groups.length} device groups`);
        return groups;
      }
      
      throw new Error(response.cause || 'Failed to fetch device list');
    } catch (error) {
      console.error('❌ Failed to get device list:', error);
      throw error;
    }
  }

  async getDeviceHistory(deviceId: string, startTime: Date, endTime: Date): Promise<GPS51Position[]> {
    try {
      console.log(`📈 Fetching history for device: ${deviceId}`);
      
      const response = await gps51SessionManager.makeAuthenticatedRequest('querytracks', {
        deviceid: deviceId,
        begintime: this.formatDateTime(startTime),
        endtime: this.formatDateTime(endTime),
        timezone: 8 // GMT+8 for GPS51
      });

      if (response.status === 0) {
        const tracks = response.records || [];
        console.log(`📈 Retrieved ${tracks.length} historical positions`);
        return tracks;
      }
      
      throw new Error(response.cause || 'Failed to fetch device history');
    } catch (error) {
      console.error('❌ Failed to get device history:', error);
      throw error;
    }
  }

  private formatDateTime(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  private emitPositionUpdates(positions: GPS51Position[]): void {
    // Emit custom event for UI updates
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('gps51PositionUpdate', {
        detail: { 
          positions,
          timestamp: Date.now()
        }
      }));
    }
  }

  private emitDeviceListUpdate(groups: GPS51DeviceGroup[]): void {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('gps51DeviceListUpdate', {
        detail: { 
          groups,
          timestamp: Date.now()
        }
      }));
    }
  }

  private emitConnectionLost(): void {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('gps51ConnectionLost', {
        detail: { timestamp: Date.now() }
      }));
    }
  }

  resetQueryTime(): void {
    this.lastQueryTime = 0;
    console.log('🔄 Reset query time for fresh data fetch');
  }

  isCurrentlyPolling(): boolean {
    return this.isPolling;
  }
}

export const gps51LiveDataService = GPS51LiveDataService.getInstance();
