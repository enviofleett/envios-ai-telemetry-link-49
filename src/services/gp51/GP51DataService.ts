
import { gps51AuthService } from './Gps51AuthService';

export interface GP51ProcessedPosition {
  deviceId: string;
  deviceName: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: Date;
  isOnline: boolean;
  isMoving: boolean;
  statusText: string;
}

interface QueuedApiCall {
  resolve: (result: any) => void;
  reject: (error: any) => void;
  retry: () => Promise<any>;
}

export class GP51DataService {
  private static instance: GP51DataService;
  private readonly baseUrl = 'https://www.gps51.com/webapi';
  private apiCallQueue: QueuedApiCall[] = [];
  private isHandling401 = false;

  private constructor() {}

  public static getInstance(): GP51DataService {
    if (!GP51DataService.instance) {
      GP51DataService.instance = new GP51DataService();
    }
    return GP51DataService.instance;
  }

  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<any> {
    const token = await gps51AuthService.getToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Handle 401 Unauthorized - token might be expired
    if (response.status === 401) {
      return this.handle401Error(url, options);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check for GP51-specific error status
    if (data.status !== undefined && data.status !== 0) {
      throw new Error(data.cause || data.message || `GP51 API error (status: ${data.status})`);
    }

    return data;
  }

  private async handle401Error(url: string, options: RequestInit): Promise<any> {
    // If already handling 401, queue the request
    if (this.isHandling401) {
      return new Promise((resolve, reject) => {
        this.apiCallQueue.push({
          resolve,
          reject,
          retry: () => this.makeAuthenticatedRequest(url, options)
        });
      });
    }

    this.isHandling401 = true;

    try {
      console.log('🔄 Received 401 error, attempting token refresh...');
      
      // Force token refresh
      const newToken = await gps51AuthService.getToken();
      
      if (!newToken) {
        throw new Error('Failed to refresh token');
      }

      console.log('✅ Token refreshed, retrying original request...');

      // Retry the original request with new token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!retryResponse.ok) {
        throw new Error(`Retry failed: HTTP ${retryResponse.status}`);
      }

      const data = await retryResponse.json();
      
      // Process queued requests
      this.processApiQueue();
      
      return data;
    } catch (error) {
      console.error('❌ Failed to handle 401 error:', error);
      this.processApiQueue(error);
      throw error;
    } finally {
      this.isHandling401 = false;
    }
  }

  private processApiQueue(error?: any): void {
    this.apiCallQueue.forEach(async (queuedCall) => {
      if (error) {
        queuedCall.reject(error);
      } else {
        try {
          const result = await queuedCall.retry();
          queuedCall.resolve(result);
        } catch (retryError) {
          queuedCall.reject(retryError);
        }
      }
    });
    this.apiCallQueue = [];
  }

  public async getDeviceList(): Promise<GP51ProcessedPosition[]> {
    try {
      console.log('📡 Fetching GP51 device list...');
      
      const token = await gps51AuthService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const url = `${this.baseUrl}?action=querymonitorlist&token=${encodeURIComponent(token)}`;
      const data = await this.makeAuthenticatedRequest(url, { method: 'GET' });

      const devices = data.records || [];
      console.log(`✅ Retrieved ${devices.length} devices from GP51`);

      return devices.map((device: any) => ({
        deviceId: device.deviceid || '',
        deviceName: device.devicename || '',
        latitude: 0,
        longitude: 0,
        speed: 0,
        course: 0,
        timestamp: new Date(),
        isOnline: device.status === 'online',
        isMoving: false,
        statusText: device.status || 'unknown'
      }));
    } catch (error) {
      console.error('❌ Failed to fetch device list:', error);
      throw error;
    }
  }

  public async getDeviceLastPosition(deviceId: string): Promise<GP51ProcessedPosition | null> {
    try {
      console.log(`📍 Fetching last position for device: ${deviceId}`);
      
      const token = await gps51AuthService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const url = `${this.baseUrl}?action=querylastposition&token=${encodeURIComponent(token)}&deviceid=${encodeURIComponent(deviceId)}`;
      const data = await this.makeAuthenticatedRequest(url, { method: 'GET' });

      if (!data.records || data.records.length === 0) {
        console.log(`ℹ️ No position data found for device: ${deviceId}`);
        return null;
      }

      const position = data.records[0];
      return this.processPositionData(position);
    } catch (error) {
      console.error(`❌ Failed to fetch position for device ${deviceId}:`, error);
      return null;
    }
  }

  public async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<Map<string, GP51ProcessedPosition>> {
    const positions = new Map<string, GP51ProcessedPosition>();
    
    // Process devices in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < deviceIds.length; i += batchSize) {
      const batch = deviceIds.slice(i, i + batchSize);
      const batchPromises = batch.map(deviceId => 
        this.getDeviceLastPosition(deviceId).then(position => ({ deviceId, position }))
      );
      
      const results = await Promise.allSettled(batchPromises);
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.position) {
          positions.set(result.value.deviceId, result.value.position);
        }
      });
    }
    
    return positions;
  }

  private processPositionData(rawPosition: any): GP51ProcessedPosition {
    const lat = parseFloat(rawPosition.lat) || 0;
    const lng = parseFloat(rawPosition.lng) || 0;
    const speed = parseFloat(rawPosition.speed) || 0;
    const course = parseFloat(rawPosition.course) || 0;
    const updateTime = rawPosition.updatetime || new Date().toISOString();

    return {
      deviceId: rawPosition.deviceid || '',
      deviceName: rawPosition.devicename || '',
      latitude: lat,
      longitude: lng,
      speed: speed,
      course: course,
      timestamp: new Date(updateTime),
      isOnline: rawPosition.status === 'online' || speed > 0,
      isMoving: speed > 0.5, // Consider moving if speed > 0.5 km/h
      statusText: rawPosition.statusText || (speed > 0 ? 'Moving' : 'Stopped')
    };
  }
}

export const gp51DataService = GP51DataService.getInstance();
