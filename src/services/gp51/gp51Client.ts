
import { supabase } from '@/integrations/supabase/client';

export interface GP51ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

export class GP51Client {
  private static readonly GP51_API_URL = "https://www.gps51.com/webapi";

  private static async getValidSession() {
    const { data: session, error } = await supabase
      .from("gp51_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !session) {
      throw new Error("No valid GP51 session found");
    }

    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      throw new Error("GP51 session expired");
    }

    return session;
  }

  private static async makeApiCall(action: string, additionalParams: Record<string, string> = {}): Promise<GP51ApiResponse> {
    try {
      const session = await this.getValidSession();
      
      // Use the edge function instead of direct API calls
      const { data, error } = await supabase.functions.invoke('gp51-live-import', {
        body: { action, ...additionalParams }
      });
      
      if (error) {
        console.error(`❌ GP51 ${action} edge function error:`, error);
        return {
          success: false,
          error: error.message || `${action} failed`,
          status: 500
        };
      }

      return {
        success: data.success || false,
        data: data.data || data,
        status: data.success ? 200 : 400
      };

    } catch (error) {
      console.error(`❌ GP51 ${action} exception:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `${action} failed`,
        status: 500
      };
    }
  }

  // User Management APIs
  static async addUser(userData: {
    username: string;
    password: string;
    showname: string;
    email?: string;
    usertype?: number;
    multilogin?: number;
  }): Promise<GP51ApiResponse> {
    const { data, error } = await supabase.functions.invoke('gp51-user-management', {
      body: {
        action: 'adduser',
        ...userData
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  }

  static async editUser(userData: {
    username: string;
    showname?: string;
    email?: string;
    usertype?: number;
  }): Promise<GP51ApiResponse> {
    const { data, error } = await supabase.functions.invoke('gp51-user-management', {
      body: {
        action: 'edituser',
        ...userData
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  }

  static async deleteUser(username: string): Promise<GP51ApiResponse> {
    const { data, error } = await supabase.functions.invoke('gp51-user-management', {
      body: {
        action: 'deleteuser',
        usernames: username
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  }

  // Device Management APIs
  static async chargeDevices(deviceData: {
    deviceids: string;
    chargeyears: number;
    devicetype?: number;
  }): Promise<GP51ApiResponse> {
    const { data, error } = await supabase.functions.invoke('gp51-device-management', {
      body: {
        action: 'chargedevices',
        ...deviceData
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  }

  static async setDeviceProperty(deviceData: {
    deviceid: string;
    propname: string;
    propvalue: string;
  }): Promise<GP51ApiResponse> {
    const { data, error } = await supabase.functions.invoke('gp51-device-management', {
      body: {
        action: 'setdeviceprop',
        ...deviceData
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  }

  // Monitoring APIs
  static async queryMonitorList(): Promise<GP51ApiResponse> {
    return this.makeApiCall('querymonitorlist');
  }

  static async queryLastPosition(deviceIds?: string[]): Promise<GP51ApiResponse> {
    const params: Record<string, string> = {};
    if (deviceIds && deviceIds.length > 0) {
      params.deviceids = deviceIds.join(',');
    }
    return this.makeApiCall('lastposition', params);
  }

  static async queryTracks(deviceId: string, startTime: string, endTime: string): Promise<GP51ApiResponse> {
    return this.makeApiCall('querytracks', {
      deviceid: deviceId,
      starttime: startTime,
      endtime: endTime
    });
  }

  static async queryAllUsers(): Promise<GP51ApiResponse> {
    const { data, error } = await supabase.functions.invoke('gp51-user-management', {
      body: { action: 'test_user_creation', username: 'test' }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  }

  static async queryAllDevices(): Promise<GP51ApiResponse> {
    const { data, error } = await supabase.functions.invoke('gp51-device-management', {
      body: { action: 'queryalldevices' }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  }
}
