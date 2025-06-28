
import { supabase } from '@/integrations/supabase/client';
import { gps51SessionManager } from './GPS51SessionManager';

export interface GPS51Position {
  deviceid: string;
  devicename?: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: number;
  address?: string;
  status: number;
  moving: number;
  altitude?: number;
  gpstime: number;
}

export interface GPS51LastPositionResponse {
  status: number;
  cause?: string;
  records: GPS51Position[];
  lastquerypositiontime: number;
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

export interface GPS51DeviceListResponse {
  status: number;
  cause?: string;
  devices: GPS51Device[];
}

export class GPS51LiveDataService {
  private static instance: GPS51LiveDataService;
  private lastQueryTime: number = 0;

  static getInstance(): GPS51LiveDataService {
    if (!GPS51LiveDataService.instance) {
      GPS51LiveDataService.instance = new GPS51LiveDataService();
    }
    return GPS51LiveDataService.instance;
  }

  async getDeviceList(): Promise<GPS51DeviceListResponse> {
    try {
      const session = gps51SessionManager.getSession();
      if (!session || !session.token) {
        throw new Error('No GPS51 session available');
      }

      console.log('🔄 Fetching GPS51 device list...');

      const { data, error } = await supabase.functions.invoke('gp51-service', {
        body: {
          action: 'querymonitorlist',
          token: session.token,
          username: session.username
        }
      });

      if (error) {
        console.error('❌ GPS51 device list error:', error);
        throw error;
      }

      if (data.status !== 0) {
        throw new Error(data.cause || 'Failed to fetch device list');
      }

      console.log(`✅ Retrieved ${data.devices?.length || 0} GPS51 devices`);
      return data;
    } catch (error) {
      console.error('💥 GPS51 device list service error:', error);
      throw error;
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<GPS51LastPositionResponse> {
    try {
      const session = gps51SessionManager.getSession();
      if (!session || !session.token) {
        throw new Error('No GPS51 session available');
      }

      console.log('📍 Fetching GPS51 last positions...');

      const requestBody: any = {
        action: 'lastposition',
        token: session.token,
        lastquerypositiontime: this.lastQueryTime
      };

      if (deviceIds && deviceIds.length > 0) {
        requestBody.deviceids = deviceIds;
      }

      const { data, error } = await supabase.functions.invoke('gp51-service', {
        body: requestBody
      });

      if (error) {
        console.error('❌ GPS51 positions error:', error);
        throw error;
      }

      if (data.status !== 0) {
        throw new Error(data.cause || 'Failed to fetch positions');
      }

      // Update last query time for incremental updates
      if (data.lastquerypositiontime) {
        this.lastQueryTime = data.lastquerypositiontime;
      }

      console.log(`✅ Retrieved ${data.records?.length || 0} GPS51 positions`);
      return data;
    } catch (error) {
      console.error('💥 GPS51 positions service error:', error);
      throw error;
    }
  }

  async getDeviceHistory(deviceId: string, startTime: Date, endTime: Date): Promise<any> {
    try {
      const session = gps51SessionManager.getSession();
      if (!session || !session.token) {
        throw new Error('No GPS51 session available');
      }

      console.log(`📈 Fetching GPS51 history for device: ${deviceId}`);

      const { data, error } = await supabase.functions.invoke('gp51-service', {
        body: {
          action: 'querytracks',
          token: session.token,
          deviceid: deviceId,
          begintime: this.formatDateTime(startTime),
          endtime: this.formatDateTime(endTime),
          timezone: 8
        }
      });

      if (error) {
        console.error('❌ GPS51 history error:', error);
        throw error;
      }

      if (data.status !== 0) {
        throw new Error(data.cause || 'Failed to fetch device history');
      }

      console.log(`✅ Retrieved history for device: ${deviceId}`);
      return data;
    } catch (error) {
      console.error('💥 GPS51 history service error:', error);
      throw error;
    }
  }

  private formatDateTime(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  resetQueryTime(): void {
    this.lastQueryTime = 0;
  }
}

export const gps51LiveDataService = GPS51LiveDataService.getInstance();
