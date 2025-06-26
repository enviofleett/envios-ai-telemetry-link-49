import CryptoJS from 'crypto-js';
import { supabase } from '@/integrations/supabase/client';

interface GP51Config {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  defaultTimezone: number;
}

export class ProductionGP51Service {
  private config: GP51Config = {
    baseUrl: 'https://www.gps51.com/webapi',
    timeout: 30000,
    retryAttempts: 3,
    defaultTimezone: 8
  };

  private currentToken: string | null = null;
  private currentUser: string | null = null;

  // Add missing properties for compatibility
  get isAuthenticated(): boolean {
    return this.currentToken !== null;
  }

  get currentUsername(): string | null {
    return this.currentUser;
  }

  async authenticate(username: string, password: string, userType: 'USER' | 'DEVICE' = 'USER'): Promise<GP51AuthResponse> {
    try {
      const hashedPassword = this.md5Hash(password);
      
      const response = await this.makeRequest('login', {
        username,
        password: hashedPassword,
        from: 'WEB',
        type: userType
      });

      if (response.status === 0) {
        this.currentToken = response.token;
        this.currentUser = username;
        
        // Store session in database using correct schema
        await this.storeSession(username, hashedPassword, {
          token: response.token,
          expires_at: response.expires_at,
          login_time: new Date().toISOString(),
          user_type: userType,
          is_admin: username === 'octopus'
        });

        await this.logOperation('auth', username, { userType }, response);
      }

      return response;
    } catch (error) {
      await this.logOperation('auth', username, { userType }, null, error);
      throw error;
    }
  }

  // Add missing methods for compatibility
  async loadExistingSession(username: string): Promise<boolean> {
    try {
      const { data: session } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (session && session.gp51_token) {
        this.currentToken = session.gp51_token;
        this.currentUser = username;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error loading existing session:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    if (this.currentUser) {
      await supabase
        .from('gp51_sessions')
        .update({ is_active: false })
        .eq('username', this.currentUser);
    }
    
    this.currentToken = null;
    this.currentUser = null;
  }

  async fetchAllUsers(): Promise<GP51User[]> {
    if (!this.currentToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await this.makeRequest('querymonitorlist', {
        username: this.currentUser
      });

      if (response.status !== 0) {
        throw new Error(`GP51 API Error: ${response.cause}`);
      }

      const users: GP51User[] = [];
      
      if (response.groups) {
        for (const group of response.groups) {
          if (group.devices) {
            for (const device of group.devices) {
              await this.storeDeviceData(device, group);
            }
          }
        }
      }

      await this.logOperation('fetch_users', this.currentUser, {}, response);
      return users;
    } catch (error) {
      await this.logOperation('fetch_users', this.currentUser, {}, null, error);
      throw error;
    }
  }

  async fetchAllDevices(): Promise<GP51Device[]> {
    if (!this.currentToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await this.makeRequest('querymonitorlist', {
        username: this.currentUser
      });

      if (response.status !== 0) {
        throw new Error(`GP51 API Error: ${response.cause}`);
      }

      const devices: GP51Device[] = [];

      if (response.groups) {
        for (const group of response.groups) {
          if (group.devices) {
            for (const device of group.devices) {
              devices.push(device);
              await this.storeDeviceData(device, group);
            }
          }
        }
      }

      await this.logOperation('fetch_devices', this.currentUser, {}, response);
      return devices;
    } catch (error) {
      await this.logOperation('fetch_devices', this.currentUser, {}, null, error);
      throw error;
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    if (!this.currentToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await this.makeRequest('lastposition', {
        deviceids: deviceIds || [],
        lastquerypositiontime: 0
      });

      if (response.status !== 0) {
        throw new Error(`GP51 API Error: ${response.cause}`);
      }

      const positions: GP51Position[] = response.records || [];

      for (const position of positions) {
        await this.storePositionData(position);
      }

      await this.logOperation('position_update', this.currentUser, { deviceIds }, response);
      return positions;
    } catch (error) {
      await this.logOperation('position_update', this.currentUser, { deviceIds }, null, error);
      throw error;
    }
  }

  async registerUser(userData: {
    username: string;
    password: string;
    email?: string;
    companyname?: string;
    cardname?: string;
    phone?: string;
    wechat?: string;
    qq?: string;
  }): Promise<GP51AuthResponse> {
    if (!this.currentToken) {
      throw new Error('Admin authentication required');
    }

    try {
      const hashedPassword = this.md5Hash(userData.password);
      
      const response = await this.makeRequest('adduser', {
        creater: this.currentUser,
        username: userData.username,
        usertype: 11,
        password: hashedPassword,
        multilogin: 1,
        companyname: userData.companyname || '',
        email: userData.email || '',
        cardname: userData.cardname || '',
        phone: userData.phone || '',
        wechat: userData.wechat || '',
        qq: userData.qq || ''
      });

      if (response.status === 0) {
        await this.storeUserData({
          gp51_username: userData.username,
          usertype: 11,
          email: userData.email,
          companyname: userData.companyname,
          phone: userData.phone,
          wechat: userData.wechat,
          qq: userData.qq,
          creater: this.currentUser,
          user_data: userData
        });
      }

      await this.logOperation('register_user', this.currentUser, userData, response);
      return response;
    } catch (error) {
      await this.logOperation('register_user', this.currentUser, userData, null, error);
      throw error;
    }
  }

  async registerDevice(deviceData: {
    deviceid: string;
    devicename: string;
    devicetype: number;
    creater: string;
    groupid?: number;
    calmileageway?: number;
    deviceenable?: number;
    loginenable?: number;
    timezone?: number;
  }): Promise<GP51AuthResponse> {
    if (!this.currentToken) {
      throw new Error('Authentication required');
    }

    try {
      const response = await this.makeRequest('adddevice', {
        deviceid: deviceData.deviceid,
        devicename: deviceData.devicename,
        devicetype: deviceData.devicetype,
        creater: deviceData.creater,
        groupid: deviceData.groupid || 1,
        calmileageway: deviceData.calmileageway || 0,
        deviceenable: deviceData.deviceenable || 1,
        loginenable: deviceData.loginenable || 0,
        timezone: deviceData.timezone || this.config.defaultTimezone
      });

      if (response.status === 0) {
        await this.storeDeviceData({
          deviceid: deviceData.deviceid,
          devicename: deviceData.devicename,
          devicetype: deviceData.devicetype,
          status: 'active',
          lastactivetime: Date.now()
        }, { groupid: deviceData.groupid || 1, groupname: 'Default Group' });
      }

      await this.logOperation('register_device', this.currentUser, deviceData, response);
      return response;
    } catch (error) {
      await this.logOperation('register_device', this.currentUser, deviceData, null, error);
      throw error;
    }
  }

  async sendVehicleCommand(deviceid: string, command: string, params: any[] = []): Promise<GP51CommandResponse> {
    if (!this.currentToken) {
      throw new Error('Authentication required');
    }

    try {
      const response = await this.makeRequest('sendcmd', {
        deviceid,
        cmdcode: command,
        params,
        state: -1,
        cmdpwd: 'zhuyi'
      });

      await this.logOperation('send_command', this.currentUser, { deviceid, command, params }, response);
      return response;
    } catch (error) {
      await this.logOperation('send_command', this.currentUser, { deviceid, command }, null, error);
      throw error;
    }
  }

  // Private helper methods
  private async makeRequest(action: string, data: any): Promise<any> {
    const url = `${this.config.baseUrl}?action=${action}${this.currentToken ? `&token=${this.currentToken}` : ''}`;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Envio-Fleet-Management/1.0'
          },
          body: JSON.stringify(data),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result;

      } catch (error) {
        if (attempt === this.config.retryAttempts) {
          throw new Error(`GP51 API request failed after ${this.config.retryAttempts} attempts: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  private md5Hash(input: string): string {
    return CryptoJS.MD5(input).toString().toLowerCase();
  }

  private async storeSession(username: string, passwordHash: string, sessionData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('gp51_sessions')
        .upsert({
          username,
          password_hash: passwordHash,
          gp51_token: sessionData.token,
          token_expires_at: sessionData.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          last_activity_at: new Date().toISOString(),
          is_active: true
        }, {
          onConflict: 'username'
        });

      if (error) {
        console.error('Failed to store session:', error);
        throw error;
      }
    } catch (error) {
      console.error('Session storage error:', error);
      throw error;
    }
  }

  private async storeUserData(userData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('gp51_users')
        .upsert({
          gp51_username: userData.gp51_username,
          user_data: userData,
          usertype: userData.usertype,
          showname: userData.showname || userData.username,
          companyname: userData.companyname,
          email: userData.email,
          phone: userData.phone,
          wechat: userData.wechat,
          qq: userData.qq,
          creater: userData.creater,
          sync_status: 'synced',
          last_sync: new Date().toISOString()
        }, {
          onConflict: 'gp51_username'
        });

      if (error) throw error;
    } catch (error) {
      console.error('User storage error:', error);
      throw error;
    }
  }

  private async storeDeviceData(device: any, group: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('gp51_devices')
        .upsert({
          device_id: device.deviceid,
          device_name: device.devicename,
          device_type: device.devicetype,
          device_data: device,
          group_id: group.groupid,
          group_name: group.groupname,
          status: device.status || 'active',
          is_online: device.lastactivetime > (Date.now() - 300000),
          last_active_time: new Date(device.lastactivetime).toISOString(),
          sim_number: device.simnum,
          sync_status: 'synced',
          last_sync: new Date().toISOString()
        }, {
          onConflict: 'device_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Device storage error:', error);
      throw error;
    }
  }

  private async storePositionData(position: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('live_positions')
        .upsert({
          device_id: position.deviceid,
          position_data: position,
          latitude: position.callat || position.lat,
          longitude: position.callon || position.lon,
          speed: position.speed || 0,
          course: position.course || 0,
          altitude: position.altitude || 0,
          accuracy_radius: position.radius || 0,
          position_timestamp: new Date(position.updatetime || position.devicetime).toISOString(),
          server_timestamp: new Date().toISOString(),
          status_code: position.status,
          status_description: position.strstatus,
          alarm_code: position.alarm,
          alarm_description: position.stralarm,
          location_source: position.gotsrc || 'gps',
          signal_strength: position.rxlevel,
          gps_satellite_count: position.gpsvalidnum,
          voltage: position.voltagev,
          fuel_level: position.masteroil,
          is_moving: position.moving === 1,
          parking_duration: position.parkduration,
          total_distance: position.totaldistance,
          report_mode: position.reportmode
        }, {
          onConflict: 'device_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Position storage error:', error);
      throw error;
    }
  }

  private async logOperation(operation: string, username: string, requestData: any, responseData: any, error?: any): Promise<void> {
    try {
      await supabase
        .from('gp51_sync_log')
        .insert({
          operation_type: operation,
          username,
          request_data: requestData,
          response_data: responseData,
          status: error ? 'error' : 'success',
          error_message: error?.message,
          duration_ms: Date.now() - (requestData.startTime || Date.now()),
          gp51_status_code: responseData?.status
        });
    } catch (logError) {
      console.error('Failed to log operation:', logError);
    }
  }
}

export const productionGP51Service = new ProductionGP51Service();

// Type definitions
interface GP51AuthResponse {
  status: number;
  cause: string;
  token?: string;
  expires_at?: string;
}

interface GP51User {
  username: string;
  usertype: number;
  showname: string;
  companyname?: string;
  email?: string;
  phone?: string;
}

interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  status: string;
  lastactivetime: number;
  simnum?: string;
}

interface GP51Position {
  deviceid: string;
  callat: number;
  callon: number;
  speed: number;
  updatetime: number;
  status: number;
  strstatus: string;
}

interface GP51CommandResponse {
  status: number;
  cause: string;
}
