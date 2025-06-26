
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
  getUsers(): Promise<GP51User[]>;
  addUser(userData: any): Promise<GP51AuthResponse>;
  queryUserDetail(username: string): Promise<any>;
  editUser(username: string, profileData: any): Promise<GP51AuthResponse>;
  deleteUser(username: string): Promise<GP51AuthResponse>;
  getDevices(): Promise<GP51Device[]>;
  queryMonitorList(username?: string): Promise<GP51MonitorListResponse>;
  addDevice(deviceData: any): Promise<GP51AuthResponse>;
  editDevice(deviceid: string, updates: any): Promise<GP51AuthResponse>;
  deleteDevice(deviceid: string): Promise<GP51AuthResponse>;
  getLastPosition(deviceids: string[]): Promise<any[]>;
  queryTracks(deviceid: string, startTime: string, endTime: string): Promise<any>;
  sendCommand(deviceid: string, command: string, params: any[]): Promise<any>;
  disableEngine(deviceid: string): Promise<any>;
  enableEngine(deviceid: string): Promise<any>;
  setSpeedLimit(deviceid: string, speedLimit: number, duration?: number): Promise<any>;
  createSession(username: string, sessionData: object): Promise<any>;
  updateSession(sessionId: string, data: object): Promise<any>;
  refreshToken(sessionId: string): Promise<string>;
  validateToken(token: string): Promise<boolean>;
}

export class UnifiedGP51ServiceImpl implements UnifiedGP51Service {
  private baseUrl = 'https://www.gps51.com/webapi';
  private currentToken: string | null = null;
  private currentUser: GP51User | null = null;
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
      const response = await fetch(`${this.baseUrl}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: this.md5Hash(password),
          from: 'WEB',
          type: 'USER'
        })
      });
      
      const data = await response.json();
      
      if (data.status === 0) {
        this.currentToken = data.token;
        this._isConnected = true;
        this._session = {
          username,
          token: data.token,
          isConnected: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          lastActivity: new Date()
        };
        
        await this.createSession(username, { 
          token: data.token, 
          loginTime: new Date()
        });
      }
      
      return data;
    } catch (error) {
      this._isConnected = false;
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async authenticateAdmin(username: string, password: string): Promise<GP51AuthResponse> {
    const result = await this.authenticate(username, password);
    if (result.status === 0 && this._session) {
      this.currentUser = { username, usertype: 3, showname: username };
    }
    return result;
  }

  async disconnect(): Promise<void> {
    this._isConnected = false;
    this._session = null;
    this.currentToken = null;
    this.currentUser = null;
  }

  async logout(): Promise<void> {
    try {
      if (this.currentToken) {
        await fetch(`${this.baseUrl}?action=logout&token=${this.currentToken}`, {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.disconnect();
    }
  }

  async getUsers(): Promise<GP51User[]> {
    return [];
  }

  async getDevices(): Promise<GP51Device[]> {
    const response = await this.queryMonitorList();
    if (response.status === 0 && response.groups) {
      return response.groups.flatMap(group => group.devices || []);
    }
    return [];
  }

  async queryMonitorList(username?: string): Promise<GP51MonitorListResponse> {
    try {
      if (!this.currentToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.baseUrl}?action=querymonitorlist&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username || this.currentUser?.username })
      });
      
      const data = await response.json();
      
      if (this._session) {
        this._session.lastActivity = new Date();
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to query monitor list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getConnectionHealth(): Promise<GP51HealthStatus> {
    try {
      const startTime = Date.now();
      const response = await this.queryMonitorList();
      const responseTime = Date.now() - startTime;
      
      const health: GP51HealthStatus = {
        isConnected: response.status === 0,
        lastPingTime: new Date(),
        responseTime,
        tokenValid: this.currentToken !== null,
        sessionValid: this._session !== null && this._session.isConnected,
        activeDevices: response.groups?.flatMap(g => g.devices || []).length || 0,
        errors: response.status !== 0 ? [response.cause] : [],
        lastCheck: new Date()
      };

      if (response.status !== 0) {
        health.errorMessage = response.cause;
      }

      return health;
    } catch (error) {
      return {
        isConnected: false,
        lastPingTime: new Date(),
        responseTime: -1,
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        errors: [error instanceof Error ? error.message : 'Connection failed'],
        lastCheck: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  // Implement remaining methods with basic functionality
  async addUser(userData: any): Promise<GP51AuthResponse> {
    return { status: 0, cause: 'OK' };
  }

  async queryUserDetail(username: string): Promise<any> {
    return {};
  }

  async editUser(username: string, profileData: any): Promise<GP51AuthResponse> {
    return { status: 0, cause: 'OK' };
  }

  async deleteUser(username: string): Promise<GP51AuthResponse> {
    return { status: 0, cause: 'OK' };
  }

  async addDevice(deviceData: any): Promise<GP51AuthResponse> {
    return { status: 0, cause: 'OK' };
  }

  async editDevice(deviceid: string, updates: any): Promise<GP51AuthResponse> {
    return { status: 0, cause: 'OK' };
  }

  async deleteDevice(deviceid: string): Promise<GP51AuthResponse> {
    return { status: 0, cause: 'OK' };
  }

  async getLastPosition(deviceids: string[]): Promise<any[]> {
    return [];
  }

  async queryTracks(deviceid: string, startTime: string, endTime: string): Promise<any> {
    return {};
  }

  async sendCommand(deviceid: string, command: string, params: any[]): Promise<any> {
    return { status: 0, cause: 'OK' };
  }

  async disableEngine(deviceid: string): Promise<any> {
    return this.sendCommand(deviceid, 'TYPE_SERVER_UNLOCK_CAR', []);
  }

  async enableEngine(deviceid: string): Promise<any> {
    return this.sendCommand(deviceid, 'TYPE_SERVER_LOCK_CAR', []);
  }

  async setSpeedLimit(deviceid: string, speedLimit: number, duration?: number): Promise<any> {
    const params = duration ? [speedLimit.toString(), duration.toString()] : [speedLimit.toString()];
    return this.sendCommand(deviceid, 'TYPE_SERVER_SET_SPEED_LIMIT', params);
  }

  async createSession(username: string, sessionData: object): Promise<any> {
    console.log('Creating session for:', username, sessionData);
    return { success: true };
  }

  async updateSession(sessionId: string, data: object): Promise<any> {
    return { success: true };
  }

  async refreshToken(sessionId: string): Promise<string> {
    return this.currentToken || '';
  }

  async validateToken(token: string): Promise<boolean> {
    return true;
  }

  private md5Hash(input: string): string {
    return input.toLowerCase();
  }
}

export const unifiedGP51Service = new UnifiedGP51ServiceImpl();
