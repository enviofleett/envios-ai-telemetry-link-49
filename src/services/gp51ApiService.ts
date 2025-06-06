
import { supabase } from '@/integrations/supabase/client';

interface GP51AuthResponse {
  status: number;
  token?: string;
  cause?: string;
  message?: string;
}

interface GP51Vehicle {
  deviceid: number;
  devicename: string;
  devicetype: number;
  groupid: number;
  username: string;
  devicestatus: number;
  overduetime: string;
  timezone: number;
  icontype: number;
  offline_delay: number;
  lastupdate: string;
  lat: number;
  lng: number;
  speed: number;
  course: number;
  acc: number;
  oil: number;
  temperature: number;
  gsm: number;
  gps: number;
}

interface GP51VehiclesResponse {
  status: number;
  devicelist?: GP51Vehicle[];
  cause?: string;
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
      
      // Hash password with MD5
      const hashedPassword = await this.hashMD5(password);
      
      const authUrl = `${this.baseUrl}/webapi?action=login&token=`;
      const authData = {
        action: 'login',
        username: username.trim(),
        password: hashedPassword
      };

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Fleet-Management-System/1.0'
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

  async fetchVehicles(): Promise<{ success: boolean; vehicles?: GP51Vehicle[]; error?: string }> {
    if (!this.token || !this.username) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log(`Fetching vehicles for user: ${this.username}`);
      
      const vehiclesUrl = `${this.baseUrl}/webapi?action=getdevices&token=${this.token}`;
      
      const response = await fetch(vehiclesUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Fleet-Management-System/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GP51VehiclesResponse = await response.json();

      if (result.status === 0 && result.devicelist) {
        console.log(`Successfully fetched ${result.devicelist.length} vehicles`);
        return { success: true, vehicles: result.devicelist };
      } else {
        const errorMsg = result.cause || 'Failed to fetch vehicles';
        console.error(`GP51 vehicles fetch failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('GP51 vehicles fetch error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown vehicles fetch error' 
      };
    }
  }

  async importVehiclesToDatabase(vehicles: GP51Vehicle[]): Promise<{ success: boolean; imported: number; errors: string[] }> {
    if (!this.username) {
      return { success: false, imported: 0, errors: ['No username available'] };
    }

    let imported = 0;
    const errors: string[] = [];

    for (const vehicle of vehicles) {
      try {
        // Prepare vehicle data for storage
        const vehicleData = {
          device_id: vehicle.deviceid.toString(),
          device_name: vehicle.devicename || `Device ${vehicle.deviceid}`,
          device_type: vehicle.devicetype,
          group_id: vehicle.groupid,
          gp51_username: this.username,
          device_status: vehicle.devicestatus,
          overdue_time: vehicle.overduetime,
          timezone: vehicle.timezone,
          icon_type: vehicle.icontype,
          offline_delay: vehicle.offline_delay,
          last_update: vehicle.lastupdate,
          latitude: vehicle.lat,
          longitude: vehicle.lng,
          speed: vehicle.speed,
          course: vehicle.course,
          acc_status: vehicle.acc,
          oil_level: vehicle.oil,
          temperature: vehicle.temperature,
          gsm_signal: vehicle.gsm,
          gps_signal: vehicle.gps,
          is_active: true, // Mark as active during import
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert or update vehicle
        const { error } = await supabase
          .from('vehicles')
          .upsert(vehicleData, {
            onConflict: 'device_id'
          });

        if (error) {
          console.error(`Failed to import vehicle ${vehicle.deviceid}:`, error);
          errors.push(`Vehicle ${vehicle.deviceid}: ${error.message}`);
        } else {
          imported++;
          console.log(`Successfully imported vehicle: ${vehicle.devicename} (${vehicle.deviceid})`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error importing vehicle ${vehicle.deviceid}:`, errorMsg);
        errors.push(`Vehicle ${vehicle.deviceid}: ${errorMsg}`);
      }
    }

    return { 
      success: errors.length === 0, 
      imported, 
      errors 
    };
  }

  async performHealthCheck(): Promise<{ 
    success: boolean; 
    status: string; 
    details: {
      authentication: boolean;
      vehicleFetch: boolean;
      databaseAccess: boolean;
    };
    error?: string;
  }> {
    const details = {
      authentication: false,
      vehicleFetch: false,
      databaseAccess: false
    };

    try {
      // Test database access first
      const { error: dbError } = await supabase
        .from('vehicles')
        .select('id')
        .limit(1);
      
      details.databaseAccess = !dbError;

      if (this.token && this.username) {
        details.authentication = true;
        
        // Test vehicle fetch
        const vehiclesResult = await this.fetchVehicles();
        details.vehicleFetch = vehiclesResult.success;
      }

      const allHealthy = details.authentication && details.vehicleFetch && details.databaseAccess;
      
      return {
        success: allHealthy,
        status: allHealthy ? 'healthy' : 'degraded',
        details
      };
    } catch (error) {
      return {
        success: false,
        status: 'critical',
        details,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  private async hashMD5(text: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('MD5', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback for environments without MD5 support
      console.warn('MD5 not supported, using fallback hash');
      return text; // In production, implement proper fallback
    }
  }
}

export const gp51ApiService = new GP51ApiService();
