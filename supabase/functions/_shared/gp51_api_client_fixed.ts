
import { md5_sync } from './crypto_utils.ts';

export interface GP51ApiResponse {
  status: number;
  cause?: string;
  message?: string;
  [key: string]: any;
}

export interface GP51LoginResponse extends GP51ApiResponse {
  token?: string;
  username?: string;
  usertype?: number;
  nickname?: string;
  email?: string;
}

export interface GP51MonitorListResponse extends GP51ApiResponse {
  groups?: Array<{
    groupid: number;
    groupname: string;
    remark?: string;
    shared: number;
    devices: Array<{
      deviceid: string;
      devicename: string;
      devicetype: number;
      simnum?: string;
      createtime: number;
      lastactivetime: number;
      isfree: number;
      creater: string;
      [key: string]: any;
    }>;
  }>;
}

export interface GP51UserDetailResponse extends GP51ApiResponse {
  username?: string;
  showname?: string;
  usertype?: number;
  companyname?: string;
  email?: string;
  phone?: string;
  qq?: string;
  wechat?: string;
  multilogin?: number;
}

export interface GP51TracksResponse extends GP51ApiResponse {
  records?: Array<{
    deviceid: string;
    timestamp: number;
    lat: number;
    lon: number;
    speed: number;
    course: number;
    altitude?: number;
    [key: string]: any;
  }>;
}

export interface GP51TripsResponse extends GP51ApiResponse {
  trips?: Array<{
    deviceid: string;
    starttime: number;
    endtime: number;
    startlat: number;
    startlon: number;
    endlat: number;
    endlon: number;
    distance: number;
    duration: number;
    maxspeed: number;
    avgspeed: number;
    [key: string]: any;
  }>;
}

export class GP51UnifiedClient {
  private baseUrl = 'https://www.gps51.com/webapi';
  private username: string;
  private password: string;
  private token: string | null = null;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  private async makeRequest(action: string, params: Record<string, any> = {}): Promise<GP51ApiResponse> {
    try {
      const url = `${this.baseUrl}?action=${action}&token=${this.token || ''}`;
      
      console.log(`🔄 [GP51-FIXED] Making ${action} request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📊 [GP51-FIXED] ${action} response:`, data);
      
      return data;
    } catch (error) {
      console.error(`❌ [GP51-FIXED] ${action} request failed:`, error);
      throw error;
    }
  }

  async login(): Promise<{ success: boolean; token?: string; message?: string }> {
    try {
      console.log(`🔐 [GP51-FIXED] Starting login for user: ${this.username}`);
      
      const hashedPassword = md5_sync(this.password);
      const loginUrl = `${this.baseUrl}?action=login&token=6c1f1207c35d97a744837a19663ecdbe`;
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER',
        }),
      });

      if (!response.ok) {
        throw new Error(`Login HTTP error! status: ${response.status}`);
      }

      const data: GP51LoginResponse = await response.json();
      console.log(`🔐 [GP51-FIXED] Login response:`, data);

      if (data.status === 0 && data.token) {
        this.token = data.token;
        console.log(`✅ [GP51-FIXED] Login successful, token length: ${data.token.length}`);
        return { success: true, token: data.token };
      } else {
        console.error(`❌ [GP51-FIXED] Login failed:`, data.cause || data.message);
        return { success: false, message: data.cause || data.message || 'Login failed' };
      }
    } catch (error) {
      console.error(`❌ [GP51-FIXED] Login error:`, error);
      return { success: false, message: error instanceof Error ? error.message : 'Login failed' };
    }
  }

  async queryMonitorList(): Promise<GP51MonitorListResponse> {
    if (!this.token) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        throw new Error(loginResult.message || 'Login failed');
      }
    }

    console.log(`📡 [GP51-FIXED] Querying monitor list for user: ${this.username}`);
    const response = await this.makeRequest('querymonitorlist', {
      username: this.username,
    });

    if (response.status === 0) {
      console.log(`✅ [GP51-FIXED] Query successful, found ${response.groups?.length || 0} groups`);
    } else {
      console.error(`❌ [GP51-FIXED] Query failed:`, response.cause);
    }

    return response as GP51MonitorListResponse;
  }

  async queryUserDetail(targetUsername?: string): Promise<GP51UserDetailResponse> {
    if (!this.token) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        throw new Error(loginResult.message || 'Login failed');
      }
    }

    const username = targetUsername || this.username;
    console.log(`👤 [GP51-FIXED] Querying user details for: ${username}`);
    
    const response = await this.makeRequest('queryuserdetail', {
      username: username,
    });

    if (response.status === 0) {
      console.log(`✅ [GP51-FIXED] User detail query successful for: ${username}`);
    } else {
      console.error(`❌ [GP51-FIXED] User detail query failed:`, response.cause);
    }

    return response as GP51UserDetailResponse;
  }

  async queryTracks(deviceId: string, beginTime: string, endTime: string, timezone: number = 8): Promise<GP51TracksResponse> {
    if (!this.token) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        throw new Error(loginResult.message || 'Login failed');
      }
    }

    console.log(`🛣️ [GP51-FIXED] Querying tracks for device: ${deviceId} from ${beginTime} to ${endTime}`);
    
    const response = await this.makeRequest('querytracks', {
      deviceid: deviceId,
      begintime: beginTime,
      endtime: endTime,
      timezone: timezone,
    });

    if (response.status === 0) {
      console.log(`✅ [GP51-FIXED] Tracks query successful, found ${response.records?.length || 0} records`);
    } else {
      console.error(`❌ [GP51-FIXED] Tracks query failed:`, response.cause);
    }

    return response as GP51TracksResponse;
  }

  async queryTrips(deviceId: string, beginTime: string, endTime: string, timezone: number = 8): Promise<GP51TripsResponse> {
    if (!this.token) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        throw new Error(loginResult.message || 'Login failed');
      }
    }

    console.log(`🚗 [GP51-FIXED] Querying trips for device: ${deviceId} from ${beginTime} to ${endTime}`);
    
    const response = await this.makeRequest('querytrips', {
      deviceid: deviceId,
      begintime: beginTime,
      endtime: endTime,
      timezone: timezone,
    });

    if (response.status === 0) {
      console.log(`✅ [GP51-FIXED] Trips query successful, found ${response.trips?.length || 0} trips`);
    } else {
      console.error(`❌ [GP51-FIXED] Trips query failed:`, response.cause);
    }

    return response as GP51TripsResponse;
  }

  async queryLastPosition(deviceIds: string[] = []): Promise<GP51ApiResponse> {
    if (!this.token) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        throw new Error(loginResult.message || 'Login failed');
      }
    }

    console.log(`📍 [GP51-FIXED] Querying last position for devices:`, deviceIds);
    
    const response = await this.makeRequest('lastposition', {
      deviceids: deviceIds,
      lastquerypositiontime: 0,
    });

    if (response.status === 0) {
      console.log(`✅ [GP51-FIXED] Position query successful, found ${response.records?.length || 0} positions`);
    } else {
      console.error(`❌ [GP51-FIXED] Position query failed:`, response.cause);
    }

    return response;
  }

  // Combined method for getting devices with their current positions
  async getDevicesWithPositions(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      // First get the device list
      const monitorListResponse = await this.queryMonitorList();
      
      if (monitorListResponse.status !== 0) {
        return {
          success: false,
          message: monitorListResponse.cause || 'Failed to get device list'
        };
      }

      // Extract all device IDs
      const deviceIds: string[] = [];
      const devices: any[] = [];
      
      monitorListResponse.groups?.forEach(group => {
        group.devices?.forEach(device => {
          deviceIds.push(device.deviceid);
          devices.push({
            ...device,
            groupId: group.groupid,
            groupName: group.groupname,
          });
        });
      });

      // Get current positions for all devices
      let positions: any[] = [];
      if (deviceIds.length > 0) {
        const positionResponse = await this.queryLastPosition(deviceIds);
        if (positionResponse.status === 0 && positionResponse.records) {
          positions = positionResponse.records;
        }
      }

      return {
        success: true,
        data: {
          groups: monitorListResponse.groups,
          devices,
          positions,
          deviceCount: devices.length,
          groupCount: monitorListResponse.groups?.length || 0,
        }
      };
    } catch (error) {
      console.error('❌ [GP51-FIXED] getDevicesWithPositions failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get devices with positions'
      };
    }
  }

  // Method for getting devices hierarchy (used by unified client)
  async getDevicesHierarchy(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      console.log('🚀 [GP51-UNIFIED] Starting devices hierarchy fetch');
      
      const monitorResponse = await this.queryMonitorList();
      
      if (monitorResponse.status !== 0) {
        return {
          success: false,
          message: monitorResponse.cause || 'Failed to fetch devices hierarchy'
        };
      }

      // Transform the data into a consistent format
      const groups = monitorResponse.groups || [];
      const flatDevices: any[] = [];
      
      groups.forEach(group => {
        group.devices?.forEach(device => {
          flatDevices.push({
            ...device,
            groupId: group.groupid,
            groupName: group.groupname,
          });
        });
      });

      const hierarchyData = {
        groups,
        flatDevices,
        deviceCount: flatDevices.length,
        groupCount: groups.length,
      };

      console.log('✅ [GP51-UNIFIED] Devices hierarchy retrieved successfully');
      
      return {
        success: true,
        data: hierarchyData
      };
    } catch (error) {
      console.error('❌ [GP51-UNIFIED] Devices hierarchy fetch failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch devices hierarchy'
      };
    }
  }
}
