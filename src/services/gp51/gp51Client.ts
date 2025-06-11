
import { supabase } from '@/integrations/supabase/client';

export interface GP51ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

export class GP51Client {
  private static readonly GP51_API_URL = "https://api.gpstrackerxy.com/api";

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
      
      const formData = new URLSearchParams({
        action,
        json: "1",
        suser: session.username,
        stoken: session.gp51_token,
        ...additionalParams
      });

      console.log(`🌐 GP51 API Call: ${action}`);

      const response = await fetch(this.GP51_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "User-Agent": "EnvioFleet/1.0"
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        console.error(`❌ GP51 API HTTP error: ${response.status} ${response.statusText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }

      const text = await response.text();
      console.log(`📊 Raw GP51 ${action} response:`, text.substring(0, 500) + '...');

      let json;
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        console.error(`❌ GP51 ${action} returned invalid JSON:`, text.substring(0, 200));
        return {
          success: false,
          error: `Invalid GP51 ${action} response format`,
          status: 502
        };
      }

      if (json.result === "false" || json.result === false) {
        console.error(`🛑 GP51 API ${action} returned false:`, json.message);
        return {
          success: false,
          error: json.message || `${action} failed`,
          status: 401
        };
      }

      return {
        success: true,
        data: json,
        status: 200
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
    return this.makeApiCall('adduser', {
      username: userData.username,
      password: userData.password,
      showname: userData.showname,
      email: userData.email || '',
      usertype: String(userData.usertype || 3),
      multilogin: String(userData.multilogin || 1)
    });
  }

  static async editUser(userData: {
    username: string;
    showname?: string;
    email?: string;
    usertype?: number;
  }): Promise<GP51ApiResponse> {
    const params: Record<string, string> = {
      username: userData.username
    };

    if (userData.showname) params.showname = userData.showname;
    if (userData.email) params.email = userData.email;
    if (userData.usertype) params.usertype = String(userData.usertype);

    return this.makeApiCall('edituser', params);
  }

  static async deleteUser(username: string): Promise<GP51ApiResponse> {
    return this.makeApiCall('deleteuser', {
      usernames: username
    });
  }

  // Device Management APIs
  static async chargeDevices(deviceData: {
    deviceids: string;
    chargeyears: number;
    devicetype?: number;
  }): Promise<GP51ApiResponse> {
    return this.makeApiCall('chargedevices', {
      deviceids: deviceData.deviceids,
      chargeyears: String(deviceData.chargeyears),
      devicetype: String(deviceData.devicetype || 1)
    });
  }

  static async setDeviceProperty(deviceData: {
    deviceid: string;
    propname: string;
    propvalue: string;
  }): Promise<GP51ApiResponse> {
    return this.makeApiCall('setdeviceprop', {
      deviceid: deviceData.deviceid,
      propname: deviceData.propname,
      propvalue: deviceData.propvalue
    });
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
    return this.makeApiCall('queryallusers');
  }

  static async queryAllDevices(): Promise<GP51ApiResponse> {
    return this.makeApiCall('queryalldevices');
  }
}
