
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

export interface GP51Position {
  deviceid: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  altitude: number;
  timestamp: string;
  status: string;
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

export interface GP51ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UnifiedGP51Service {
  // Authentication methods
  authenticate(credentials: { username: string; password: string; apiUrl?: string }): Promise<boolean>;
  logout(): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<GP51ServiceResult>;
  
  // Connection health
  getConnectionHealth(): Promise<GP51HealthStatus>;
  
  // Session management
  session: GP51Session | null;
  isConnected: boolean;
  
  // User management
  getUsers(): Promise<GP51User[]>;
  addUser(userData: any): Promise<GP51AuthResponse>;
  queryUserDetail(username: string): Promise<any>;
  editUser(username: string, profileData: any): Promise<GP51AuthResponse>;
  deleteUser(username: string): Promise<GP51AuthResponse>;
  
  // Device management  
  getDevices(): Promise<GP51Device[]>;
  queryMonitorList(username?: string): Promise<GP51MonitorListResponse>;
  addDevice(deviceData: any): Promise<GP51AuthResponse>;
  editDevice(deviceid: string, updates: any): Promise<GP51AuthResponse>;
  deleteDevice(deviceid: string): Promise<GP51AuthResponse>;
  
  // Position tracking
  getLastPosition(deviceids: string[]): Promise<any[]>;
  queryTracks(deviceid: string, startTime: string, endTime: string): Promise<any>;
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

  async authenticate(credentials: { username: string; password: string; apiUrl?: string }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: this.md5Hash(credentials.password),
          from: 'WEB',
          type: 'USER'
        })
      });
      
      const data = await response.json();
      
      if (data.status === 0) {
        this.currentToken = data.token;
        this._isConnected = true;
        this._session = {
          username: credentials.username,
          token: data.token,
          isConnected: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          lastActivity: new Date()
        };
        
        this.currentUser = {
          username: credentials.username,
          usertype: 11,
          showname: credentials.username
        };
        
        return true;
      }
      
      return false;
    } catch (error) {
      this._isConnected = false;
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async testConnection(): Promise<GP51ServiceResult> {
    try {
      const health = await this.getConnectionHealth();
      return {
        success: health.isConnected,
        data: health,
        error: health.isConnected ? undefined : (health.errorMessage || 'Connection failed')
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
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
    const response = await this.queryMonitorList();
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

  async addUser(userData: any): Promise<GP51AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}?action=adduser&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          password: this.md5Hash(userData.password)
        })
      });
      return await response.json();
    } catch (error) {
      return { status: 1, cause: error instanceof Error ? error.message : 'Failed to add user' };
    }
  }

  async queryUserDetail(username: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}?action=queryuserdetail&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to query user detail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async editUser(username: string, profileData: any): Promise<GP51AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}?action=edituser&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, ...profileData })
      });
      return await response.json();
    } catch (error) {
      return { status: 1, cause: error instanceof Error ? error.message : 'Failed to edit user' };
    }
  }

  async deleteUser(username: string): Promise<GP51AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}?action=deleteuser&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username] })
      });
      return await response.json();
    } catch (error) {
      return { status: 1, cause: error instanceof Error ? error.message : 'Failed to delete user' };
    }
  }

  async addDevice(deviceData: any): Promise<GP51AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}?action=adddevice&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData)
      });
      return await response.json();
    } catch (error) {
      return { status: 1, cause: error instanceof Error ? error.message : 'Failed to add device' };
    }
  }

  async editDevice(deviceid: string, updates: any): Promise<GP51AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}?action=editdevicesimple&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceid, ...updates })
      });
      return await response.json();
    } catch (error) {
      return { status: 1, cause: error instanceof Error ? error.message : 'Failed to edit device' };
    }
  }

  async deleteDevice(deviceid: string): Promise<GP51AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}?action=deletedevice&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceid })
      });
      return await response.json();
    } catch (error) {
      return { status: 1, cause: error instanceof Error ? error.message : 'Failed to delete device' };
    }
  }

  async getLastPosition(deviceids: string[]): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}?action=lastposition&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deviceids,
          lastquerypositiontime: 0
        })
      });
      const data = await response.json();
      return data.records || [];
    } catch (error) {
      console.error('Failed to get last position:', error);
      return [];
    }
  }

  async queryTracks(deviceid: string, startTime: string, endTime: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}?action=querytracks&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceid,
          begintime: startTime,
          endtime: endTime,
          timezone: 8
        })
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to query tracks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private md5Hash(input: string): string {
    return input.toLowerCase();
  }
}

export const unifiedGP51Service = new UnifiedGP51ServiceImpl();
