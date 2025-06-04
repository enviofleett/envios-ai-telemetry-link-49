
import { createHash } from 'crypto';

export interface GP51LoginRequest {
  action: string;
  username: string;
  password: string;
  from: string;
  type: string;
}

export interface GP51LoginResponse {
  status: number;
  cause?: string;
  token?: string;
}

export interface Vehicle {
  deviceid: string;
  devicename: string;
  status?: string;
}

export interface VehiclePosition {
  deviceid: string;
  callat: number;
  callon: number;
  updatetime: string;
  speed: number;
  course: number;
  strstatusen: string;
}

export interface GP51Response<T> {
  status: number;
  cause?: string;
  records?: T[];
}

class TelemetryApiService {
  private baseUrl = 'https://www.gps51.com/webapi';
  private token: string | null = null;
  private username: string | null = null;

  private md5Hash(text: string): string {
    return createHash('md5').update(text).digest('hex').toLowerCase();
  }

  async authenticate(username: string, password: string): Promise<{ success: boolean; error?: string; vehicles?: Vehicle[] }> {
    try {
      console.log('Starting authentication process for user:', username);
      
      const hashedPassword = this.md5Hash(password);
      console.log('Password hashed successfully');

      const loginData: GP51LoginRequest = {
        action: 'login',
        username,
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      };

      const response = await fetch(`${this.baseUrl}?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GP51LoginResponse = await response.json();
      console.log('GP51 login response:', result);

      if (result.status === 0 && result.token) {
        this.token = result.token;
        this.username = username;
        console.log('Authentication successful, token obtained');

        // Immediately fetch vehicle list
        const vehicles = await this.getVehicleList();
        return { success: true, vehicles };
      } else {
        console.log('Authentication failed:', result.cause);
        return { success: false, error: result.cause || 'Authentication failed' };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  async getVehicleList(): Promise<Vehicle[]> {
    if (!this.token || !this.username) {
      throw new Error('Not authenticated');
    }

    try {
      console.log('Fetching vehicle list...');
      
      const response = await fetch(`${this.baseUrl}?action=querymonitorlist&token=${this.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: this.username }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GP51Response<Vehicle> = await response.json();
      console.log('Vehicle list response:', result);

      if (result.status === 0 && result.records) {
        return result.records;
      } else {
        throw new Error(result.cause || 'Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<VehiclePosition[]> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      console.log('Fetching last positions...');
      
      const requestBody = {
        deviceids: deviceIds || [],
        lastquerypositiontime: ''
      };

      const response = await fetch(`${this.baseUrl}?action=lastposition&token=${this.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GP51Response<VehiclePosition> = await response.json();
      console.log('Last positions response:', result);

      if (result.status === 0 && result.records) {
        return result.records;
      } else {
        throw new Error(result.cause || 'Failed to fetch positions');
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  logout(): void {
    this.token = null;
    this.username = null;
  }
}

export const telemetryApi = new TelemetryApiService();
