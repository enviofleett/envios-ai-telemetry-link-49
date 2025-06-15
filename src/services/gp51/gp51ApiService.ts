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
      
      // Use the settings-management edge function for authentication
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'save-gp51-credentials',
          username: username.trim(),
          password: password,
          testOnly: true
        }
      });

      if (error) {
        console.error('GP51 authentication failed:', error);
        return { success: false, error: error.message };
      }

      if (data.success) {
        this.username = username.trim();
        console.log(`GP51 authentication successful for user: ${username}`);
        return { success: true, token: 'authenticated' };
      } else {
        const errorMsg = data.error || 'Authentication failed';
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
    try {
      console.log(`Fetching device list via new edge function 'gp51-device-list'`);
      
      const { data, error } = await supabase.functions.invoke('gp51-device-list');
      
      if (error) {
        console.error('Device list fetch failed:', error);
        return { success: false, error: error.message };
      }

      if (data.success && data.devices) {
        const devices = data.devices;
        console.log(`Successfully fetched ${devices.length} devices`);
        return { success: true, devices };
      } else {
        const errorMsg = data.error || 'Failed to fetch devices';
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
    try {
      console.log(`Fetching last positions via edge function`);
      
      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data');
      
      if (error) {
        console.error('Positions fetch failed:', error);
        return { success: false, error: error.message };
      }

      if (data.success && data.data && data.data.telemetry) {
        const positions = data.data.telemetry;
        console.log(`Successfully fetched ${positions.length} position records`);
        return { success: true, positions };
      } else {
        const errorMsg = data.error || 'Failed to fetch positions';
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
    // This would need a specific edge function for tracks, for now return not implemented
    return { 
      success: false, 
      error: 'Track fetching not implemented in edge functions yet' 
    };
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    this.token = null;
    this.username = null;
    console.log('GP51 logout successful');
    return { success: true };
  }

  async saveCredentialsToDatabase(credentials: { username: string; password: string; apiUrl?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { 
          action: 'save-gp51-credentials',
          username: credentials.username,
          password: credentials.password,
          apiUrl: credentials.apiUrl,
          testOnly: false
        }
      });
      
      if (error) throw error;
      
      return { success: data.success, error: data.error };
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
      const { data, error } = await supabase.functions.invoke('gp51-connection-check');
      
      if (error) throw error;
      
      return {
        connected: data.success || false,
        username: data.username,
        error: data.error
      };
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
