
import { md5_sync } from './crypto_utils.ts';

export interface GP51ApiResponse<T = any> {
  status: number;
  cause?: string;
  [key: string]: any;
}

export interface DeviceInfo {
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
}

export interface GroupInfo {
  groupid: number;
  groupname: string;
  remark: string;
  devices: DeviceInfo[];
}

export interface MonitorListResponse extends GP51ApiResponse {
  groups: GroupInfo[];
}

export class GP51ApiClient {
  private baseUrl = 'https://www.gps51.com/webapi';
  private token: string = '';

  constructor(private username: string, private password: string) {}

  /**
   * Login to GP51 API and get token
   */
  async login(): Promise<boolean> {
    console.log(`🔐 [GP51-FIXED] Starting login for user: ${this.username}`);
    
    try {
      const response = await fetch(`${this.baseUrl}?action=login&token=`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: md5_sync(this.password), // Password must be MD5 hashed
          from: 'WEB',
          type: 'USER'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`🔐 [GP51-FIXED] Login response:`, data);
      
      if (data.status === 0 && data.token) {
        this.token = data.token;
        console.log(`✅ [GP51-FIXED] Login successful, token length: ${this.token.length}`);
        return true;
      } else {
        console.error(`❌ [GP51-FIXED] Login failed:`, data.cause || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error(`❌ [GP51-FIXED] Login error:`, error);
      return false;
    }
  }

  /**
   * CORRECT METHOD: Query devices list (replaces queryDevicesTree)
   * This is the actual GP51 API method for getting device hierarchy
   */
  async queryDevicesList(username?: string): Promise<MonitorListResponse | null> {
    if (!this.token) {
      console.error('❌ [GP51-FIXED] Not authenticated. Call login() first.');
      return null;
    }

    console.log(`📡 [GP51-FIXED] Querying monitor list for user: ${username || this.username}`);

    try {
      const response = await fetch(`${this.baseUrl}?action=querymonitorlist&token=${this.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username || this.username
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MonitorListResponse = await response.json();
      console.log(`📊 [GP51-FIXED] Monitor list response:`, data);
      
      if (data.status === 0) {
        console.log(`✅ [GP51-FIXED] Query successful, found ${data.groups?.length || 0} groups`);
        return data;
      } else {
        console.error(`❌ [GP51-FIXED] Query devices list failed:`, data.cause);
        return null;
      }
    } catch (error) {
      console.error(`❌ [GP51-FIXED] Query devices list error:`, error);
      return null;
    }
  }

  /**
   * Get flattened device tree structure
   * This provides the tree-like structure you were probably looking for
   */
  async getDevicesTree(username?: string): Promise<{
    groups: GroupInfo[];
    flatDevices: DeviceInfo[];
    deviceCount: number;
    groupCount: number;
  } | null> {
    const result = await this.queryDevicesList(username);
    
    if (!result) return null;

    const flatDevices: DeviceInfo[] = [];
    
    // Flatten all devices from all groups
    result.groups.forEach(group => {
      if (group.devices) {
        flatDevices.push(...group.devices);
      }
    });

    return {
      groups: result.groups,
      flatDevices,
      deviceCount: flatDevices.length,
      groupCount: result.groups.length
    };
  }

  /**
   * Get devices with their last positions (more complete device info)
   */
  async getDevicesWithLastPosition(deviceIds?: string[]): Promise<any> {
    if (!this.token) {
      console.error('❌ [GP51-FIXED] Not authenticated. Call login() first.');
      return null;
    }

    console.log(`📍 [GP51-FIXED] Querying last position for ${deviceIds?.length || 'all'} devices`);

    try {
      const response = await fetch(`${this.baseUrl}?action=lastposition&token=${this.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceids: deviceIds || [], // Empty array means all devices
          lastquerypositiontime: 0 // First time query
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📍 [GP51-FIXED] Last position response:`, data);
      
      if (data.status === 0) {
        console.log(`✅ [GP51-FIXED] Position query successful`);
        return data;
      } else {
        console.error(`❌ [GP51-FIXED] Query last position failed:`, data.cause);
        return null;
      }
    } catch (error) {
      console.error(`❌ [GP51-FIXED] Query last position error:`, error);
      return null;
    }
  }
}

// Usage Example and Migration Guide
export class GP51UnifiedClient {
  private client: GP51ApiClient;

  constructor(username: string, password: string) {
    this.client = new GP51ApiClient(username, password);
  }

  /**
   * FIXED: Replace your queryDevicesTree calls with this method
   */
  async getDevicesHierarchy(): Promise<any> {
    try {
      console.log(`🚀 [GP51-UNIFIED] Starting devices hierarchy fetch`);
      
      // First, authenticate
      const loginSuccess = await this.client.login();
      if (!loginSuccess) {
        throw new Error('Authentication failed');
      }

      // Get the devices tree (this replaces queryDevicesTree)
      const devicesTree = await this.client.getDevicesTree();
      if (!devicesTree) {
        throw new Error('Failed to fetch devices tree');
      }

      console.log(`✅ [GP51-UNIFIED] Devices hierarchy retrieved successfully`);
      return {
        success: true,
        data: devicesTree,
        message: 'Devices tree retrieved successfully'
      };
    } catch (error) {
      console.error(`❌ [GP51-UNIFIED] GetDevicesHierarchy error:`, error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Enhanced version with device positions
   */
  async getDevicesWithPositions(): Promise<any> {
    try {
      console.log(`🚀 [GP51-UNIFIED] Starting devices with positions fetch`);
      
      const loginSuccess = await this.client.login();
      if (!loginSuccess) {
        throw new Error('Authentication failed');
      }

      // Get basic device list first
      const devicesList = await this.client.queryDevicesList();
      if (!devicesList) {
        throw new Error('Failed to fetch devices list');
      }

      // Extract all device IDs
      const deviceIds: string[] = [];
      devicesList.groups.forEach(group => {
        if (group.devices) {
          deviceIds.push(...group.devices.map(device => device.deviceid));
        }
      });

      console.log(`📍 [GP51-UNIFIED] Found ${deviceIds.length} devices, fetching positions...`);

      // Get positions for all devices
      const devicesWithPositions = await this.client.getDevicesWithLastPosition(deviceIds);
      
      console.log(`✅ [GP51-UNIFIED] Devices with positions retrieved successfully`);
      
      return {
        success: true,
        data: {
          hierarchy: devicesList,
          positions: devicesWithPositions,
          summary: {
            totalGroups: devicesList.groups.length,
            totalDevices: deviceIds.length
          }
        },
        message: 'Devices with positions retrieved successfully'
      };
    } catch (error) {
      console.error(`❌ [GP51-UNIFIED] GetDevicesWithPositions error:`, error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
