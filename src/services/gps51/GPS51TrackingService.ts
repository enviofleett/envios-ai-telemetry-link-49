import { GPS51ApiClient, GPS51LoginRequest, GPS51LoginResponse } from './GPS51ApiClient';

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
  success: boolean;
  positions: DevicePosition[];
  error?: string;
}

export interface DevicePosition {
  deviceid: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  altitude: number;
  timestamp: number;
  address: string;
  status: string;
}

export interface HistoricalTracksResult {
  success: boolean;
  tracks: TrackPoint[];
  error?: string;
}

export interface TrackPoint {
  lat: number;
  lon: number;
  timestamp: number;
  speed: number;
  altitude: number;
  address: string;
  status: string;
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
  fuelconsumption?: number;
  route: TrackPoint[];
}

export interface DeviceListResult {
  success: boolean;
  devices: Device[];
  groups?: any[];
  error?: string;
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
    try {
      if (!this.apiClient.isAuthenticated()) {
        throw new Error('Not authenticated with GPS51');
      }

      console.log('🚗 Fetching device list from GPS51...');

      const response = await fetch(`https://www.gps51.com/webapi?action=querymonitorlist&token=${this.apiClient.getToken()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: 'user' // Will be replaced with actual username
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 0) {
        throw new Error(result.cause || 'Failed to fetch device list');
      }

      // Process groups and extract devices
      const groups = result.groups || [];
      const devices: Device[] = [];

      groups.forEach((group: any) => {
        if (group.devices) {
          group.devices.forEach((device: any) => {
            devices.push({
              deviceid: device.deviceid,
              devicename: device.devicename,
              devicetype: device.devicetype || 0,
              simnum: device.simnum || '',
              lastactivetime: device.lastactivetime || 0,
              isfree: device.isfree || 1,
              status: this.determineDeviceStatus(device)
            });
          });
        }
      });

      console.log(`✅ Retrieved ${devices.length} devices from GPS51`);

      return {
        success: true,
        devices,
        groups
      };

    } catch (error) {
      console.error('❌ Error fetching device list:', error);
      return {
        success: false,
        devices: [],
        error: error instanceof Error ? error.message : 'Failed to fetch devices'
      };
    }
  }

  /**
   * Get last known position for devices
   */
  async getLastPositions(deviceIds?: string[]): Promise<LastPositionResult> {
    try {
      if (!this.apiClient.isAuthenticated()) {
        throw new Error('Not authenticated with GPS51');
      }

      console.log('📍 Fetching last positions from GPS51...');

      const requestBody = {
        deviceids: deviceIds || [],
        lastquerypositiontime: 0
      };

      const response = await fetch(`https://www.gps51.com/webapi?action=lastposition&token=${this.apiClient.getToken()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 0) {
        throw new Error(result.cause || 'Failed to fetch positions');
      }

      const positions: DevicePosition[] = (result.records || []).map((record: any) => ({
        deviceid: record.deviceid,
        lat: record.lat,
        lon: record.lon,
        speed: record.speed || 0,
        course: record.course || 0,
        altitude: record.altitude || 0,
        timestamp: record.utc || Date.now(),
        address: record.address || '',
        status: record.status || 'unknown'
      }));

      console.log(`✅ Retrieved positions for ${positions.length} devices`);

      return {
        success: true,
        positions
      };

    } catch (error) {
      console.error('❌ Error fetching positions:', error);
      return {
        success: false,
        positions: [],
        error: error instanceof Error ? error.message : 'Failed to fetch positions'
      };
    }
  }

  /**
   * Query historical tracks for a device
   */
  async getHistoricalTracks(deviceId: string, startTime: Date, endTime: Date): Promise<HistoricalTracksResult> {
    try {
      if (!this.apiClient.isAuthenticated()) {
        throw new Error('Not authenticated with GPS51');
      }

      console.log(`📊 Fetching historical tracks for device ${deviceId}...`);

      const requestBody = {
        deviceid: deviceId,
        begintime: this.formatDateForAPI(startTime),
        endtime: this.formatDateForAPI(endTime),
        timezone: 8 // Default timezone
      };

      const response = await fetch(`https://www.gps51.com/webapi?action=querytracks&token=${this.apiClient.getToken()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 0) {
        throw new Error(result.cause || 'Failed to fetch historical tracks');
      }

      const tracks: TrackPoint[] = (result.records || []).map((record: any) => ({
        lat: record.lat,
        lon: record.lon,
        timestamp: record.utc || Date.now(),
        speed: record.speed || 0,
        altitude: record.altitude || 0,
        address: record.address || '',
        status: record.status || 'unknown'
      }));

      console.log(`✅ Retrieved ${tracks.length} track points for device ${deviceId}`);

      return {
        success: true,
        tracks
      };

    } catch (error) {
      console.error('❌ Error fetching historical tracks:', error);
      return {
        success: false,
        tracks: [],
        error: error instanceof Error ? error.message : 'Failed to fetch tracks'
      };
    }
  }

  /**
   * Get trip data for analysis
   */
  async getTripData(deviceId: string, startTime: Date, endTime: Date): Promise<{ success: boolean; trips: TripData[]; error?: string }> {
    try {
      if (!this.apiClient.isAuthenticated()) {
        throw new Error('Not authenticated with GPS51');
      }

      console.log(`🚛 Fetching trip data for device ${deviceId}...`);

      const requestBody = {
        deviceid: deviceId,
        begintime: this.formatDateForAPI(startTime),
        endtime: this.formatDateForAPI(endTime),
        timezone: 8
      };

      const response = await fetch(`https://www.gps51.com/webapi?action=querytrips&token=${this.apiClient.getToken()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 0) {
        throw new Error(result.cause || 'Failed to fetch trip data');
      }

      const trips: TripData[] = (result.records || []).map((record: any) => ({
        tripid: record.tripid || Date.now().toString(),
        deviceid: deviceId,
        starttime: record.starttime || 0,
        endtime: record.endtime || 0,
        totaldistance: record.totaldistance || 0,
        maxspeed: record.maxspeed || 0,
        averagespeed: record.averagespeed || 0,
        totaltime: record.totaltime || 0,
        fuelconsumption: record.fuelconsumption,
        route: record.route || []
      }));

      console.log(`✅ Retrieved ${trips.length} trips for device ${deviceId}`);

      return {
        success: true,
        trips
      };

    } catch (error) {
      console.error('❌ Error fetching trip data:', error);
      return {
        success: false,
        trips: [],
        error: error instanceof Error ? error.message : 'Failed to fetch trips'
      };
    }
  }

  /**
   * Determine device status based on data
   */
  private determineDeviceStatus(device: any): 'online' | 'offline' | 'moving' | 'parked' {
    const now = Date.now();
    const lastActive = device.lastactivetime * 1000; // Convert to milliseconds
    const timeDiff = now - lastActive;

    // If last active more than 10 minutes ago, consider offline
    if (timeDiff > 10 * 60 * 1000) {
      return 'offline';
    }

    // If device has speed data, determine if moving
    if (device.speed !== undefined) {
      return device.speed > 5 ? 'moving' : 'parked';
    }

    return 'online';
  }

  /**
   * Format date for GPS51 API
   */
  private formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
