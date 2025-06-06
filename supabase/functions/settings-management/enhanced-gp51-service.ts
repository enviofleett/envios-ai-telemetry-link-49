
import { createHash } from './crypto.ts';

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

interface GP51Position {
  deviceid: number;
  lat: number;
  lng: number;
  speed: number;
  course: number;
  updatetime: string;
  acc: number;
  oil: number;
  temperature: number;
  gsm: number;
  gps: number;
}

export class EnhancedGP51Service {
  private token: string | null = null;
  private username: string | null = null;
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl.replace(/\/webapi\/?$/, '');
  }

  async authenticate(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      console.log(`GP51 authentication attempt for user: ${username}`);
      
      // Hash password with MD5 (proven working pattern)
      const hashedPassword = await createHash(password);
      
      // Use proven working endpoint pattern
      const authUrl = `${this.apiUrl}/webapi?action=login&token=`;
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

      const result = await response.json();

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
      
      // Use proven working querymonitorlist pattern
      const vehiclesUrl = `${this.apiUrl}/webapi?action=querymonitorlist&token=${encodeURIComponent(this.token)}`;
      
      const response = await fetch(vehiclesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Fleet-Management-System/1.0'
        },
        body: JSON.stringify({ username: this.username })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 0) {
        // Handle different response structures (proven pattern)
        let vehicles = [];
        
        if (result.records) {
          vehicles = result.records;
        } else if (result.monitors) {
          vehicles = result.monitors;
        } else if (result.data?.monitors) {
          vehicles = result.data.monitors;
        } else if (result.devices) {
          vehicles = result.devices;
        } else if (result.groups && Array.isArray(result.groups)) {
          // Handle grouped response structure
          vehicles = [];
          for (const group of result.groups) {
            if (group.devices && Array.isArray(group.devices)) {
              vehicles.push(...group.devices);
            }
          }
        }

        console.log(`Successfully fetched ${vehicles.length} vehicles`);
        return { success: true, vehicles };
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

  async enrichWithPositions(vehicles: GP51Vehicle[]): Promise<GP51Vehicle[]> {
    if (!vehicles || vehicles.length === 0 || !this.token) {
      return vehicles;
    }

    const deviceIds = vehicles.map(v => v.deviceid).filter(id => id);
    if (deviceIds.length === 0) {
      return vehicles;
    }

    try {
      console.log(`Fetching positions for ${deviceIds.length} vehicles...`);
      
      const positionsUrl = `${this.apiUrl}/webapi?action=lastposition&token=${encodeURIComponent(this.token)}`;
      
      const response = await fetch(positionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Fleet-Management-System/1.0'
        },
        body: JSON.stringify({
          deviceids: deviceIds,
          lastquerypositiontime: 0
        })
      });

      if (!response.ok) {
        console.warn(`GP51 positions HTTP error: ${response.status}`);
        return vehicles; // Return vehicles without positions
      }

      const result = await response.json();
      
      if (result.status === 0 && result.positions) {
        const positionMap = new Map<number, GP51Position>();
        
        result.positions.forEach((pos: GP51Position) => {
          if (pos.deviceid) {
            positionMap.set(pos.deviceid, pos);
          }
        });

        console.log(`Successfully mapped positions for ${positionMap.size} out of ${deviceIds.length} vehicles`);

        // Enrich vehicles with position data
        return vehicles.map(vehicle => ({
          ...vehicle,
          lastPosition: positionMap.get(vehicle.deviceid) || null
        }));
      } else {
        console.warn(`Position enrichment failed: ${result.cause || 'Position data not available'}`);
        return vehicles; // Don't fail the entire import
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      return vehicles; // Don't fail the entire import
    }
  }

  async performHealthCheck(): Promise<{ 
    success: boolean; 
    status: string; 
    details: {
      authentication: boolean;
      vehicleFetch: boolean;
      apiConnectivity: boolean;
    };
    error?: string;
  }> {
    const details = {
      authentication: false,
      vehicleFetch: false,
      apiConnectivity: false
    };

    try {
      // Test API connectivity
      const connectivityResponse = await fetch(`${this.apiUrl}/webapi`, {
        method: 'GET',
        headers: { 'User-Agent': 'Fleet-Management-System/1.0' }
      });
      
      details.apiConnectivity = connectivityResponse.ok;

      if (this.token && this.username) {
        details.authentication = true;
        
        // Test vehicle fetch
        const vehiclesResult = await this.fetchVehicles();
        details.vehicleFetch = vehiclesResult.success;
      }

      const allHealthy = details.authentication && details.vehicleFetch && details.apiConnectivity;
      
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
}

export async function createEnhancedGP51Service(apiUrl: string): Promise<EnhancedGP51Service> {
  return new EnhancedGP51Service(apiUrl);
}
