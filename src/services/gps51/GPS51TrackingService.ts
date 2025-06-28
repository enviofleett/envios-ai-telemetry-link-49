import { GPS51ApiClient, GPS51LoginRequest } from '../gp51/GPS51ApiClient';

export interface Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum: string;
  lastactivetime: number;
  isfree: number; // 1: normal, 2: experiencing, 3: disabled, 4: overdue, 5: expired
  status: 'online' | 'offline' | 'moving' | 'parked';
  location?: {
    lat: number;
    lon: number;
    address: string;
    updatetime: number;
  };
}

export interface LastPositionResult {
  status: number;
  cause?: string;
  devices: Array<{
    deviceid: string;
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: number;
    address?: string;
  }>;
}

export interface DeviceListResult {
  status: number;
  cause?: string;
  devices: Device[];
}

export interface HistoricalTracksResult {
  status: number;
  cause?: string;
  tracks: Array<{
    lat: number;
    lon: number;
    timestamp: number;
    speed: number;
    altitude: number;
    address: string;
  }>;
}

export interface TripData {
  tripid: string;
  deviceid: string;
  starttime: number;
  endtime: number;
  totaldistance: number;
  maxspeed: number;
  averagespeed: number;
  totaltime: number;
  route: Array<{
    lat: number;
    lon: number;
    timestamp: number;
    speed: number;
    altitude: number;
    address: string;
  }>;
}

export class GPS51TrackingService {
  private apiClient: GPS51ApiClient;

  constructor() {
    this.apiClient = new GPS51ApiClient();
  }

  /**
   * Query all devices for authenticated user
   */
  async queryDeviceList(): Promise<DeviceListResult> {
    if (!this.apiClient.isAuthenticated()) {
      throw new Error('GPS51 client is not authenticated');
    }

    try {
      const response = await fetch('https://www.gps51.com/webapi?action=querymonitorlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiClient.getToken()}`
        },
        body: JSON.stringify({
          username: 'user' // This should be the actual username
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Transform the response to match our interface
      if (result.status === 0 && result.devices) {
        result.devices = result.devices.map((device: any) => ({
          ...device,
          status: this.determineDeviceStatus(device)
        }));
      }

      return result;
    } catch (error) {
      console.error('Error querying device list:', error);
      throw error;
    }
  }

  /**
   * Get last known position for devices
   */
  async getLastPositions(deviceIds?: string[]): Promise<LastPositionResult> {
    if (!this.apiClient.isAuthenticated()) {
      throw new Error('GPS51 client is not authenticated');
    }

    try {
      const requestBody: any = {
        lastquerypositiontime: 0
      };

      if (deviceIds && deviceIds.length > 0) {
        requestBody.deviceids = deviceIds;
      }

      const response = await fetch('https://www.gps51.com/webapi?action=lastposition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiClient.getToken()}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting last positions:', error);
      throw error;
    }
  }

  /**
   * Query historical tracks
   */
  async getHistoricalTracks(
    deviceId: string, 
    startTime: Date, 
    endTime: Date
  ): Promise<HistoricalTracksResult> {
    if (!this.apiClient.isAuthenticated()) {
      throw new Error('GPS51 client is not authenticated');
    }

    try {
      const response = await fetch('https://www.gps51.com/webapi?action=querytracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiClient.getToken()}`
        },
        body: JSON.stringify({
          deviceid: deviceId,
          begintime: this.formatDateTime(startTime),
          endtime: this.formatDateTime(endTime),
          timezone: 8 // Default timezone offset
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting historical tracks:', error);
      throw error;
    }
  }

  /**
   * Query trip data
   */
  async getTripData(
    deviceId: string, 
    startTime: Date, 
    endTime: Date
  ): Promise<{ status: number; cause?: string; trips: TripData[] }> {
    if (!this.apiClient.isAuthenticated()) {
      throw new Error('GPS51 client is not authenticated');
    }

    try {
      const response = await fetch('https://www.gps51.com/webapi?action=querytrips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiClient.getToken()}`
        },
        body: JSON.stringify({
          deviceid: deviceId,
          begintime: this.formatDateTime(startTime),
          endtime: this.formatDateTime(endTime),
          timezone: 8
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting trip data:', error);
      throw error;
    }
  }

  /**
   * Determine device status based on GPS51 data
   */
  private determineDeviceStatus(device: any): 'online' | 'offline' | 'moving' | 'parked' {
    // Logic to determine status based on lastactivetime, isfree, etc.
    const now = Date.now() / 1000;
    const timeDiff = now - device.lastactivetime;
    
    // If device hasn't been active in last 5 minutes, consider offline
    if (timeDiff > 300) {
      return 'offline';
    }
    
    // If device is free (status 1) and recently active
    if (device.isfree === 1) {
      // You could add speed check here if available
      return 'online';
    }
    
    return 'parked';
  }

  /**
   * Format date for GPS51 API
   */
  private formatDateTime(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * Set API client for dependency injection
   */
  setApiClient(apiClient: GPS51ApiClient): void {
    this.apiClient = apiClient;
  }
}

// Export singleton instance
export const gps51TrackingService = new GPS51TrackingService();
