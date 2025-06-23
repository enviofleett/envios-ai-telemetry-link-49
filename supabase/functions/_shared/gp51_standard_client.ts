
// Standardized GP51 API Client following the exact API specifications
import { md5_sync } from "./crypto_utils.ts";

export interface GP51LoginResponse {
  status: number;
  cause?: string;
  token?: string;
}

export interface GP51UserDetail {
  status: number;
  cause?: string;
  username?: string;
  creater?: string;
  showname?: string;
  usertype?: number;
  multilogin?: number;
  company?: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum?: string;
  overduetime?: number;
  lastactivetime?: number;
  remark?: string;
  creater?: string;
  isfree?: number;
  allowedit?: number;
  icon?: number;
  stared?: number;
  [key: string]: any;
}

export interface GP51Group {
  groupid: number;
  groupname: string;
  remark?: string;
  devices: GP51Device[];
}

export interface GP51MonitorListResponse {
  status: number;
  cause?: string;
  groups?: GP51Group[];
}

export class GP51StandardClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'https://www.gps51.com', timeout: number = 30000) {
    this.baseUrl = baseUrl.replace(/\/webapi\/?$/, '');
    this.timeout = timeout;
  }

  private async makeRequest<T = any>(
    action: string,
    parameters: Record<string, any>,
    method: 'POST' = 'POST'
  ): Promise<T> {
    const url = `${this.baseUrl}/webapi`;
    
    console.log(`📤 [GP51Standard] Making ${method} request to: ${url}`);
    console.log(`📤 [GP51Standard] Action: ${action}`);
    console.log(`📤 [GP51Standard] Parameters:`, JSON.stringify({
      ...parameters,
      password: parameters.password ? '[REDACTED]' : undefined
    }, null, 2));

    const requestBody = {
      action,
      ...parameters
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📊 [GP51Standard] Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`📊 [GP51Standard] Raw response:`, responseText);

      let result: T;
      try {
        result = JSON.parse(responseText);
        console.log(`📊 [GP51Standard] Parsed response:`, result);
      } catch (parseError) {
        console.error(`❌ [GP51Standard] JSON parse error:`, parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ [GP51Standard] Request failed:`, error);
      throw error;
    }
  }

  async login(username: string, password: string, from: string = 'WEB', type: string = 'USER'): Promise<GP51LoginResponse> {
    console.log(`🔐 [GP51Standard] Attempting login for user: ${username}`);
    
    const hashedPassword = md5_sync(password);
    
    const result = await this.makeRequest<GP51LoginResponse>('login', {
      username: username.trim(),
      password: hashedPassword,
      from,
      type
    });
    
    if (result.status === 0 && result.token) {
      console.log(`✅ [GP51Standard] Login successful for ${username}`);
      return result;
    } else {
      const errorMsg = result.cause || `Login failed with status ${result.status}`;
      console.error(`❌ [GP51Standard] Login failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  async queryUserDetail(username: string): Promise<GP51UserDetail> {
    console.log(`👤 [GP51Standard] Querying user details for: ${username}`);
    
    const result = await this.makeRequest<GP51UserDetail>('queryuserdetail', {
      username: username.trim()
    });
    
    if (result.status === 0) {
      console.log(`✅ [GP51Standard] User details retrieved for ${username}`);
      return result;
    } else {
      const errorMsg = result.cause || `Query user detail failed with status ${result.status}`;
      console.error(`❌ [GP51Standard] Query user detail failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  async queryMonitorList(username: string): Promise<GP51MonitorListResponse> {
    console.log(`🚗 [GP51Standard] Querying monitor list for user: ${username}`);
    
    const result = await this.makeRequest<GP51MonitorListResponse>('querymonitorlist', {
      username: username.trim()
    });
    
    if (result.status === 0) {
      const deviceCount = result.groups?.reduce((sum, group) => sum + (group.devices?.length || 0), 0) || 0;
      console.log(`✅ [GP51Standard] Monitor list retrieved for ${username}, devices: ${deviceCount}`);
      return result;
    } else {
      const errorMsg = result.cause || `Query monitor list failed with status ${result.status}`;
      console.error(`❌ [GP51Standard] Query monitor list failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  async getCompleteUserData(username: string): Promise<{
    userDetail: GP51UserDetail;
    devices: GP51Device[];
    groups: GP51Group[];
  }> {
    console.log(`🔄 [GP51Standard] Getting complete data for user: ${username}`);
    
    // Get user details
    const userDetail = await this.queryUserDetail(username);
    
    // Get devices and groups
    const monitorListResponse = await this.queryMonitorList(username);
    
    const groups = monitorListResponse.groups || [];
    const devices = groups.reduce((allDevices: GP51Device[], group) => {
      return allDevices.concat(group.devices || []);
    }, []);

    console.log(`📊 [GP51Standard] Complete data retrieved for ${username}:`, {
      userFound: !!userDetail.username,
      groupCount: groups.length,
      deviceCount: devices.length
    });

    return {
      userDetail,
      devices,
      groups
    };
  }
}

export const gp51StandardClient = new GP51StandardClient();
