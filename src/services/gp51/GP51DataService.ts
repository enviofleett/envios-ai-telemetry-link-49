import { gps51AuthService } from './Gps51AuthService';
import type { VehiclePosition, GP51RawPosition } from '@/types/vehicle';

// GP51 API response interfaces
export interface GP51LastPositionResponse {
  status: number;
  cause?: string;
  records?: Array<{
    deviceid: string;
    devicetime: number;
    arrivedtime: number;
    updatetime: number;
    validpoistiontime: number;
    callat: number;
    callon: number;
    altitude: number;
    radius: number;
    speed: number;
    course: number;
    totaldistance: number;
    status: number;
    strstatus: string;
    strstatusen: string;
    alarm: number;
    stralarm: string;
    gotsrc: string;
    rxlevel: number;
    gpsvalidnum: number;
    moving: number;
    parktime: number;
    parkduration: number;
  }>;
}

export interface GP51QueryTracksResponse {
  status: number;
  cause?: string;
  deviceid?: string;
  records?: Array<{
    trackid: number;
    trackCount: number;
    starttime: number;
    endtime: number;
    arrivedtime: number;
    callat: number;
    callon: number;
    altitude: number;
    radius: number;
    speed: number;
    course: number;
    totaldistance: number;
    status: number;
    strstatus: string;
    strstatusen: string;
    updatetime: number;
  }>;
}

export interface GP51MonitorListResponse {
  status: number;
  cause?: string;
  groups?: Array<{
    groupid: number;
    groupname: string;
    remark: string;
    devices: Array<{
      deviceid: string;
      devicename: string;
      devicetype: number;
      simnum: string;
      overduetime: number;
      expirenotifytime: number;
      remark: string;
      creater: string;
      videochannelcount: number;
      lastactivetime: number;
      isfree: number;
      allowedit: number;
      icon: number;
      stared: number;
      loginame: string;
    }>;
  }>;
}

// GP51-specific processed position data (intermediate format before final VehiclePosition)
export interface GP51ProcessedPosition {
  deviceId: string;
  deviceName?: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: Date;
  status: string;
  statusText: string;
  isOnline: boolean;
  isMoving: boolean;
}

export interface VehicleTrackPoint {
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: Date;
  status: string;
}

// New interface for live vehicle filtering configuration
export interface LiveVehicleFilterConfig {
  updateTimeThresholdMinutes: number;
  includeIdleVehicles: boolean;
  requireGpsSignal: boolean;
}

class GP51DataService {
  private static instance: GP51DataService;
  private readonly baseUrl = 'https://www.gps51.com/webapi';
  private readonly requestTimeoutMs = 15000;

  static getInstance(): GP51DataService {
    if (!GP51DataService.instance) {
      GP51DataService.instance = new GP51DataService();
    }
    return GP51DataService.instance;
  }

  private log(level: 'info' | 'error' | 'warn', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [GP51Data] ${message}`;
    
    if (level === 'error') {
      console.error(logMessage, data);
    } else if (level === 'warn') {
      console.warn(logMessage, data);
    } else {
      console.log(logMessage, data);
    }
  }

  private async makeRequest(action: string, params: Record<string, any> = {}): Promise<any> {
    const token = await gps51AuthService.getToken();
    
    if (!token) {
      throw new Error('No valid GP51 authentication token available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.requestTimeoutMs);

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.append('action', action);
      url.searchParams.append('token', token);
      
      // Add additional parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });

      this.log('info', `Making GP51 data request: ${action}`, { params });
      const startTime = Date.now();
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'FleetIQ/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      
      // Enhanced null/empty response handling
      if (!responseText || responseText.trim() === '') {
        this.log('warn', 'GP51 API returned empty response', { action, duration });
        return { status: 1, cause: 'Empty response from GP51 server' };
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        this.log('error', 'Failed to parse GP51 response as JSON', { 
          responseText: responseText.substring(0, 200),
          action,
          parseError 
        });
        throw new Error('Invalid JSON response from GP51 server');
      }

      // Handle null result object
      if (result === null || result === undefined) {
        this.log('warn', 'GP51 API returned null result', { action, duration });
        return { status: 1, cause: 'Null result from GP51 server' };
      }

      // Check GP51-specific error status
      if (result.status === 1) {
        const errorMessage = result.cause || 'GP51 API error';
        this.log('error', `GP51 API returned error status: ${errorMessage}`, result);
        throw new Error(errorMessage);
      }

      this.log('info', `GP51 data request successful in ${duration}ms`, { action, status: result.status });
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        this.log('error', `GP51 data request timed out after ${this.requestTimeoutMs}ms`);
        throw new Error('GP51 connection timed out. Please try again.');
      }
      
      this.log('error', `GP51 data request failed`, error);
      throw error;
    }
  }

  private formatGP51DateTime(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  async getDeviceList(): Promise<GP51ProcessedPosition[]> {
    try {
      this.log('info', 'Fetching device list from GP51');
      
      const response: GP51MonitorListResponse = await this.makeRequest('querymonitorlist');
      
      if (!response.groups || response.groups.length === 0) {
        this.log('warn', 'No device groups found in GP51 response');
        return [];
      }

      const vehicles: GP51ProcessedPosition[] = [];
      
      response.groups.forEach(group => {
        if (group.devices && group.devices.length > 0) {
          group.devices.forEach(device => {
            vehicles.push({
              deviceId: device.deviceid,
              deviceName: device.devicename,
              latitude: 0, // Will be updated by position data
              longitude: 0,
              speed: 0,
              course: 0,
              timestamp: new Date(device.lastactivetime * 1000),
              status: 'unknown',
              statusText: 'Device registered',
              isOnline: device.lastactivetime > (Date.now() / 1000) - 1800, // Online if active within 30 minutes
              isMoving: false
            });
          });
        }
      });

      this.log('info', `Retrieved ${vehicles.length} vehicles from GP51`);
      return vehicles;
    } catch (error) {
      this.log('error', 'Failed to fetch device list', error);
      throw error;
    }
  }

  async getDeviceLastPosition(deviceId: string): Promise<GP51ProcessedPosition | null> {
    try {
      this.log('info', `Fetching last position for device: ${deviceId}`);
      
      const response: GP51LastPositionResponse = await this.makeRequest('lastposition', {
        deviceid: deviceId
      });
      
      if (!response.records || response.records.length === 0) {
        this.log('warn', `No position records found for device: ${deviceId}`);
        return null;
      }

      const record = response.records[0];
      const position: GP51ProcessedPosition = {
        deviceId: record.deviceid,
        latitude: record.callat / 1000000, // GP51 returns coordinates * 1000000
        longitude: record.callon / 1000000,
        speed: record.speed,
        course: record.course,
        timestamp: new Date(record.updatetime * 1000),
        status: record.strstatus,
        statusText: record.strstatusen || record.strstatus,
        isOnline: record.updatetime > (Date.now() / 1000) - 1800, // Online if updated within 30 minutes
        isMoving: record.moving === 1 || record.speed > 0
      };

      this.log('info', `Retrieved position for device ${deviceId}`, { 
        lat: position.latitude, 
        lng: position.longitude, 
        speed: position.speed 
      });
      
      return position;
    } catch (error) {
      this.log('error', `Failed to fetch last position for device: ${deviceId}`, error);
      throw error;
    }
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<Map<string, GP51ProcessedPosition>> {
    const results = new Map<string, GP51ProcessedPosition>();
    
    if (!deviceIds || deviceIds.length === 0) {
      return results;
    }

    this.log('info', `Fetching positions for ${deviceIds.length} devices`);

    // Make concurrent requests with error handling
    const promises = deviceIds.map(async (deviceId) => {
      try {
        const position = await this.getDeviceLastPosition(deviceId);
        if (position) {
          results.set(deviceId, position);
        }
      } catch (error) {
        this.log('warn', `Failed to get position for device ${deviceId}`, error);
        // Continue with other devices even if one fails
      }
    });

    await Promise.allSettled(promises);
    
    this.log('info', `Retrieved positions for ${results.size}/${deviceIds.length} devices`);
    return results;
  }

  async getDeviceTrackHistory(deviceId: string, startTime: Date, endTime: Date): Promise<VehicleTrackPoint[]> {
    try {
      this.log('info', `Fetching track history for device: ${deviceId}`, {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      });
      
      const response: GP51QueryTracksResponse = await this.makeRequest('querytracks', {
        deviceid: deviceId,
        start: this.formatGP51DateTime(startTime),
        end: this.formatGP51DateTime(endTime)
      });
      
      if (!response.records || response.records.length === 0) {
        this.log('warn', `No track records found for device: ${deviceId}`);
        return [];
      }

      const trackPoints: VehicleTrackPoint[] = response.records.map(record => ({
        latitude: record.callat / 1000000,
        longitude: record.callon / 1000000,
        speed: record.speed,
        course: record.course,
        timestamp: new Date(record.updatetime * 1000),
        status: record.strstatusen || record.strstatus
      }));

      this.log('info', `Retrieved ${trackPoints.length} track points for device ${deviceId}`);
      return trackPoints;
    } catch (error) {
      this.log('error', `Failed to fetch track history for device: ${deviceId}`, error);
      throw error;
    }
  }

  async getAllDevicesLastPositions(): Promise<GP51ProcessedPosition[]> {
    try {
      this.log('info', 'Fetching all devices with last positions from GP51');
      
      // Use empty deviceids to get all devices
      const response: GP51LastPositionResponse = await this.makeRequest('lastposition', {
        deviceids: '',
        lastquerypositiontime: '0'
      });
      
      if (!response.records || response.records.length === 0) {
        this.log('warn', 'No position records found for any devices');
        return [];
      }

      const positions: GP51ProcessedPosition[] = response.records.map(record => ({
        deviceId: record.deviceid,
        latitude: record.callat / 1000000,
        longitude: record.callon / 1000000,
        speed: record.speed,
        course: record.course,
        timestamp: new Date(record.updatetime * 1000),
        status: record.strstatus,
        statusText: record.strstatusen || record.strstatus,
        isOnline: record.updatetime > (Date.now() / 1000) - 1800,
        isMoving: record.moving === 1 || record.speed > 0
      }));

      this.log('info', `Retrieved ${positions.length} device positions from GP51`);
      return positions;
    } catch (error) {
      this.log('error', 'Failed to fetch all device positions', error);
      throw error;
    }
  }

  filterLiveVehicles(
    positions: GP51ProcessedPosition[], 
    config: LiveVehicleFilterConfig = {
      updateTimeThresholdMinutes: 30,
      includeIdleVehicles: true,
      requireGpsSignal: false
    }
  ): GP51ProcessedPosition[] {
    const thresholdTime = Date.now() - (config.updateTimeThresholdMinutes * 60 * 1000);
    
    return positions.filter(position => {
      // Check if position is recent enough
      const isRecent = position.timestamp.getTime() > thresholdTime;
      if (!isRecent) {
        this.log('info', `Filtering out vehicle ${position.deviceId}: Last update too old`, {
          lastUpdate: position.timestamp.toISOString(),
          thresholdMinutes: config.updateTimeThresholdMinutes
        });
        return false;
      }

      // Check if vehicle is online
      if (!position.isOnline) {
        this.log('info', `Filtering out vehicle ${position.deviceId}: Reported as offline`);
        return false;
      }

      // Check movement requirement
      if (!config.includeIdleVehicles && !position.isMoving) {
        this.log('info', `Filtering out vehicle ${position.deviceId}: Idle vehicle excluded`);
        return false;
      }

      // Check GPS signal requirement
      if (config.requireGpsSignal && (position.latitude === 0 && position.longitude === 0)) {
        this.log('info', `Filtering out vehicle ${position.deviceId}: No GPS signal`);
        return false;
      }

      return true;
    });
  }

  async getLiveVehicles(config?: LiveVehicleFilterConfig): Promise<GP51ProcessedPosition[]> {
    try {
      this.log('info', 'Fetching live vehicles from GP51', { config });
      
      const allPositions = await this.getAllDevicesLastPositions();
      const liveVehicles = this.filterLiveVehicles(allPositions, config);
      
      this.log('info', `Filtered ${liveVehicles.length} live vehicles from ${allPositions.length} total vehicles`);
      return liveVehicles;
    } catch (error) {
      this.log('error', 'Failed to fetch live vehicles', error);
      throw error;
    }
  }

  async processVehicleData(
    gp51Vehicles: any[], 
    positions: any[]
  ): Promise<GP51ProcessedPosition[]> {
    const processedVehicles: GP51ProcessedPosition[] = [];

    for (const vehicle of gp51Vehicles) {
      try {
        // Find corresponding position data
        const position = positions.find(p => p.deviceid === vehicle.deviceid);
        
        if (!position) {
          console.warn(`No position data found for device: ${vehicle.deviceid}`);
          continue;
        }

        // Process the vehicle data
        const processed: GP51ProcessedPosition = {
          deviceId: vehicle.deviceid,
          deviceName: vehicle.devicename || vehicle.deviceid,
          latitude: parseFloat(position.latitude) || 0,
          longitude: parseFloat(position.longitude) || 0,
          speed: parseFloat(position.speed) || 0,
          course: parseFloat(position.course) || 0,
          timestamp: new Date(position.gpstime || position.timestamp || Date.now()),
          status: position.status || 'unknown',
          statusText: position.statusText || '',
          isMoving: (parseFloat(position.speed) || 0) > 0,
          isOnline: position.online === true || position.online === 1
        };

        processedVehicles.push(processed);
      } catch (error) {
        console.error(`Error processing vehicle ${vehicle.deviceid}:`, error);
      }
    }

    return processedVehicles;
  }

  async processVehicleDataInChunks<T>(
    vehicles: GP51ProcessedPosition[],
    processor: (chunk: GP51ProcessedPosition[]) => Promise<T[]>,
    chunkSize: number = 50
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < vehicles.length; i += chunkSize) {
      const chunk = vehicles.slice(i, i + chunkSize);
      this.log('info', `Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(vehicles.length / chunkSize)}`, {
        chunkSize: chunk.length,
        totalVehicles: vehicles.length
      });
      
      try {
        const chunkResults = await processor(chunk);
        results.push(...chunkResults);
        
        // Small delay to prevent overwhelming the browser
        if (i + chunkSize < vehicles.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        this.log('error', `Failed to process chunk ${Math.floor(i / chunkSize) + 1}`, error);
        // Continue with other chunks
      }
    }
    
    return results;
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.log('info', 'Performing GP51 data service health check');
      
      // Try to fetch device list as a health check
      const devices = await this.getDeviceList();
      
      this.log('info', 'GP51 data service health check passed');
      return true;
    } catch (error) {
      this.log('error', 'GP51 data service health check failed', error);
      return false;
    }
  }
}

export const gp51DataService = GP51DataService.getInstance();
