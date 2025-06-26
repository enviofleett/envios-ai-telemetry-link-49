
export interface GP51User {
  username: string;
  usertype: number;
  showname: string;
  companyname?: string;
  email?: string;
  phone?: string;
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  status: string;
  lastactivetime: number;
  simnum?: string;
}

export interface GP51Group {
  groupid: number;
  groupname: string;
  devices: GP51Device[];
}

export interface GP51AuthResponse {
  status: number;
  cause: string;
  token?: string;
  expires_at?: string;
}

export interface GP51MonitorListResponse {
  status: number;
  cause: string;
  groups: GP51Group[];
}

export interface GP51Session {
  username: string;
  token: string;
  isConnected: boolean;
  expiresAt: Date;
  lastActivity: Date;
}

export interface GP51HealthStatus {
  isConnected: boolean;
  lastPingTime: Date;
  responseTime: number;
  tokenValid: boolean;
  sessionValid: boolean;
  activeDevices: number;
  errors: string[];
  lastCheck: Date;
  errorMessage?: string;
}

export interface UnifiedGP51Service {
  authenticate(username: string, password: string): Promise<GP51AuthResponse>;
  authenticateAdmin(username: string, password: string): Promise<GP51AuthResponse>;
  logout(): Promise<void>;
  disconnect(): Promise<void>;
  getConnectionHealth(): Promise<GP51HealthStatus>;
  session: GP51Session | null;
  isConnected: boolean;
  queryMonitorList(username?: string): Promise<GP51MonitorListResponse>;
  addUser(userData: any): Promise<GP51AuthResponse>;
  addDevice(deviceData: any): Promise<GP51AuthResponse>;
  sendCommand(deviceid: string, command: string, params: any[]): Promise<any>;
}

export class UnifiedGP51ServiceImpl implements UnifiedGP51Service {
  private baseUrl = 'https://www.gps51.com/webapi';
  private currentToken: string | null = null;
  private _session: GP51Session | null = null;
  private _isConnected: boolean = false;

  get session(): GP51Session | null {
    return this._session;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  async authenticate(username: string, password: string): Promise<GP51AuthResponse> {
    try {
      const mockResponse: GP51AuthResponse = {
        status: 0,
        cause: 'OK',
        token: `mock_token_${Date.now()}`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      this.currentToken = mockResponse.token;
      this._isConnected = true;
      this._session = {
        username,
        token: mockResponse.token!,
        isConnected: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lastActivity: new Date()
      };

      return mockResponse;
    } catch (error) {
      this._isConnected = false;
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async authenticateAdmin(username: string, password: string): Promise<GP51AuthResponse> {
    return this.authenticate(username, password);
  }

  async disconnect(): Promise<void> {
    this._isConnected = false;
    this._session = null;
    this.currentToken = null;
  }

  async logout(): Promise<void> {
    await this.disconnect();
  }

  async queryMonitorList(username?: string): Promise<GP51MonitorListResponse> {
    return {
      status: 0,
      cause: 'OK',
      groups: [
        {
          groupid: 1,
          groupname: 'Fleet Group 1',
          devices: [
            {
              deviceid: 'device_001',
              devicename: 'Vehicle 001',
              devicetype: 1,
              status: 'online',
              lastactivetime: Date.now(),
              simnum: '1234567890'
            }
          ]
        }
      ]
    };
  }

  async getConnectionHealth(): Promise<GP51HealthStatus> {
    return {
      isConnected: this._isConnected,
      lastPingTime: new Date(),
      responseTime: 150,
      tokenValid: this.currentToken !== null,
      sessionValid: this._session !== null,
      activeDevices: 5,
      errors: [],
      lastCheck: new Date()
    };
  }

  async addUser(userData: any): Promise<GP51AuthResponse> {
    return { status: 0, cause: 'OK' };
  }

  async addDevice(deviceData: any): Promise<GP51AuthResponse> {
    return { status: 0, cause: 'OK' };
  }

  async sendCommand(deviceid: string, command: string, params: any[]): Promise<any> {
    return { status: 0, cause: 'OK' };
  }
}

export const unifiedGP51Service = new UnifiedGP51ServiceImpl();
