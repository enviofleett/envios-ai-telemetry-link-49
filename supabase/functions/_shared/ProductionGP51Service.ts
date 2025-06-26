
// Shared Production GP51 Service for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export class ProductionGP51Service {
  private config = {
    baseUrl: 'https://www.gps51.com/webapi',
    timeout: 30000,
    retryAttempts: 3,
    defaultTimezone: 8
  };

  private currentToken: string | null = null;
  private currentUser: string | null = null;
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  get isAuthenticated(): boolean {
    return this.currentToken !== null;
  }

  get currentUsername(): string | null {
    return this.currentUser;
  }

  async authenticate(username: string, password: string): Promise<any> {
    try {
      const hashedPassword = await this.md5Hash(password);
      
      const response = await this.makeRequest('login', {
        username,
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      });

      if (response.status === 0) {
        this.currentToken = response.token;
        this.currentUser = username;
        
        // Store session in database
        await this.storeSession(username, {
          token: response.token,
          expires_at: response.expires_at,
          login_time: new Date().toISOString(),
          user_type: 'USER',
          is_admin: username === 'octopus'
        });
      }

      return response;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  async fetchAllDevices(): Promise<any[]> {
    if (!this.currentToken) {
      throw new Error('Not authenticated');
    }

    const response = await this.makeRequest('querymonitorlist', {
      username: this.currentUser
    });

    if (response.status !== 0) {
      throw new Error(`GP51 API Error: ${response.cause}`);
    }

    const devices: any[] = [];
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

    return devices;
  }

  async getLastPositions(deviceIds?: string[]): Promise<any[]> {
    if (!this.currentToken) {
      throw new Error('Not authenticated');
    }

    const response = await this.makeRequest('lastposition', {
      deviceids: deviceIds || [],
      lastquerypositiontime: 0
    });

    if (response.status !== 0) {
      throw new Error(`GP51 API Error: ${response.cause}`);
    }

    const positions = response.records || [];
    for (const position of positions) {
      await this.storePositionData(position);
    }

    return positions;
  }

  async registerUser(userData: any): Promise<any> {
    if (!this.currentToken) {
      throw new Error('Admin authentication required');
    }

    const hashedPassword = await this.md5Hash(userData.password);
    
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

    return response;
  }

  async sendVehicleCommand(deviceid: string, command: string, params: any[] = []): Promise<any> {
    if (!this.currentToken) {
      throw new Error('Authentication required');
    }

    const response = await this.makeRequest('sendcmd', {
      deviceid,
      cmdcode: command,
      params,
      state: -1,
      cmdpwd: 'zhuyi'
    });

    return response;
  }

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

        return await response.json();
      } catch (error) {
        if (attempt === this.config.retryAttempts) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  private async md5Hash(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
  }

  private async storeSession(username: string, sessionData: any): Promise<void> {
    try {
      await this.supabase
        .from('gp51_sessions')
        .upsert({
          username,
          session_data: sessionData,
          token: sessionData.token,
          expires_at: sessionData.expires_at,
          last_activity: new Date().toISOString(),
          is_admin: sessionData.is_admin || false
        }, {
          onConflict: 'username'
        });
    } catch (error) {
      console.error('Session storage error:', error);
    }
  }

  private async storeUserData(userData: any): Promise<void> {
    try {
      await this.supabase
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
    } catch (error) {
      console.error('User storage error:', error);
    }
  }

  private async storeDeviceData(device: any, group: any): Promise<void> {
    try {
      await this.supabase
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
    } catch (error) {
      console.error('Device storage error:', error);
    }
  }

  private async storePositionData(position: any): Promise<void> {
    try {
      await this.supabase
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
          status_code: position.status,
          status_description: position.strstatus,
          alarm_code: position.alarm,
          alarm_description: position.stralarm,
          location_source: position.gotsrc,
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
    } catch (error) {
      console.error('Position storage error:', error);
    }
  }
}
