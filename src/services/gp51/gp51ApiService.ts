import { supabase } from '@/integrations/supabase/client';
import { crossBrowserMD5 } from './crossBrowserMD5';

interface GP51AuthResponse {
  status: number;
  token?: string;
  cause?: string;
  message?: string;
}

interface GP51Device {
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

interface GP51Group {
  groupid: number;
  groupname: string;
  remark: string;
  devices: GP51Device[];
}

interface GP51MonitorListResponse {
  status: number;
  cause?: string;
  groups?: GP51Group[];
}

interface GP51Position {
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
}

interface GP51PositionResponse {
  status: number;
  cause?: string;
  records?: GP51Position[];
  lastquerypositiontime?: number;
}

interface GP51TrackPoint {
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
}

interface GP51TracksResponse {
  status: number;
  cause?: string;
  deviceid?: string;
  records?: GP51TrackPoint[];
}

export class GP51ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private username: string | null = null;

  constructor(baseUrl: string = 'https://www.gps51.com') {
    this.baseUrl = baseUrl.replace(/\/webapi\/?$/, '');
  }

  async authenticate(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      console.log(`GP51 authentication attempt for user: ${username}`);
      
      // Use cross-browser MD5 implementation
      const hashedPassword = await crossBrowserMD5(password);
      
      const authUrl = `${this.baseUrl}/webapi?action=login&token=`;
      const authData = {
        action: 'login',
        username: username.trim(),
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      };

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(authData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GP51AuthResponse = await response.json();

      if (result.status === 0 && result.token) {
        this.token = result.token;
        this.username = username.trim();
        console.log(`GP51 authentication successful for user: ${username}`);
        return { success: true, token: result.token };
      } else {
        const errorMsg = result.cause || result.message || 'Authentication failed';
        console.error(`GP51 authentication failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('GP51 authentication error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown authentication error' 
      };
    }
  }

  async getDeviceList(): Promise<{ success: boolean; devices?: GP51Device[]; error?: string }> {
    if (!this.token || !this.username) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log(`Fetching device list for user: ${this.username}`);
      
      const url = `${this.baseUrl}/webapi?action=querymonitorlist&token=${this.token}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username: this.username })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GP51MonitorListResponse = await response.json();

      if (result.status === 0 && result.groups) {
        const devices: GP51Device[] = [];
        result.groups.forEach(group => {
          if (group.devices) {
            devices.push(...group.devices);
          }
        });
        
        console.log(`Successfully fetched ${devices.length} devices`);
        return { success: true, devices };
      } else {
        const errorMsg = result.cause || 'Failed to fetch devices';
        console.error(`GP51 device list fetch failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('GP51 device list fetch error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown device fetch error' 
      };
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<{ success: boolean; positions?: GP51Position[]; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log(`Fetching last positions for devices: ${deviceIds ? deviceIds.length : 'all'}`);
      
      const url = `${this.baseUrl}/webapi?action=lastposition&token=${this.token}`;
      
      const requestBody: any = {
        lastquerypositiontime: 0
      };

      if (deviceIds && deviceIds.length > 0) {
        requestBody.deviceids = deviceIds;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GP51PositionResponse = await response.json();

      if (result.status === 0 && result.records) {
        console.log(`Successfully fetched ${result.records.length} position records`);
        return { success: true, positions: result.records };
      } else {
        const errorMsg = result.cause || 'Failed to fetch positions';
        console.error(`GP51 positions fetch failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('GP51 positions fetch error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown positions fetch error' 
      };
    }
  }

  async getDeviceTracks(deviceId: string, startTime: string, endTime: string): Promise<{ success: boolean; tracks?: GP51TrackPoint[]; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log(`Fetching tracks for device: ${deviceId} from ${startTime} to ${endTime}`);
      
      const url = `${this.baseUrl}/webapi?action=querytracks&token=${this.token}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          deviceid: deviceId,
          begintime: startTime,
          endtime: endTime
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GP51TracksResponse = await response.json();

      if (result.status === 0 && result.records) {
        console.log(`Successfully fetched ${result.records.length} track points`);
        return { success: true, tracks: result.records };
      } else {
        const errorMsg = result.cause || 'Failed to fetch tracks';
        console.error(`GP51 tracks fetch failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('GP51 tracks fetch error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown tracks fetch error' 
      };
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const url = `${this.baseUrl}/webapi?action=logout&token=${this.token}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 0) {
        this.token = null;
        this.username = null;
        console.log('GP51 logout successful');
        return { success: true };
      } else {
        const errorMsg = result.cause || 'Logout failed';
        console.error(`GP51 logout failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('GP51 logout error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown logout error' 
      };
    }
  }

  async saveCredentialsToDatabase(credentials: { username: string; password: string; apiUrl?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { 
          action: 'save-gp51-credentials',
          username: credentials.username,
          password: credentials.password,
          apiUrl: credentials.apiUrl
        }
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Failed to save GP51 credentials:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save credentials' 
      };
    }
  }

  async getConnectionStatus(): Promise<{ connected: boolean; username?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Failed to get GP51 status:', error);
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Failed to check status' 
      };
    }
  }
}

export const gp51ApiService = new GP51ApiService();
