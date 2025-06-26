import { supabase } from '@/integrations/supabase/client';
import { md5 } from 'js-md5';

export interface GP51AuthResult {
  status: number;
  cause?: string;
  message?: string;
  token?: string;
  expires_at?: string;
}

export interface GP51User {
  id: string;
  username: string;
  email?: string;
  showname?: string;
  companyname?: string;
  phone?: string;
  usertype?: number;
  creater?: string;
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype?: number;
  status?: string;
  lastactivetime?: string;
  simnum?: string;
  owner_username?: string;
}

export class ProductionGP51Service {
  private static instance: ProductionGP51Service;
  private currentSession: {
    username: string;
    token: string;
    expiresAt: Date;
  } | null = null;

  private readonly API_BASE_URL = 'https://www.gps51.com/webapi';
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  static getInstance(): ProductionGP51Service {
    if (!ProductionGP51Service.instance) {
      ProductionGP51Service.instance = new ProductionGP51Service();
    }
    return ProductionGP51Service.instance;
  }

  get isAuthenticated(): boolean {
    return this.currentSession !== null && this.currentSession.expiresAt > new Date();
  }

  get currentUsername(): string | null {
    return this.currentSession?.username || null;
  }

  get currentToken(): string | null {
    return this.currentSession?.token || null;
  }

  async authenticate(username: string, password: string): Promise<GP51AuthResult> {
    try {
      console.log(`🔐 Authenticating with GP51: ${username}`);
      
      const hashedPassword = md5(password);
      const url = new URL(this.API_BASE_URL);
      url.searchParams.append('action', 'login');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: hashedPassword,
          from: 'WEB',
          type: 'USER',
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: GP51AuthResult = await response.json();
      console.log('📊 GP51 Authentication Response:', result);

      if (result.status === 0 && result.token) {
        // Store session
        this.currentSession = {
          username: username.trim(),
          token: result.token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };

        // Store in Supabase
        await this.storeSession(username.trim(), result.token);
        
        console.log('✅ GP51 Authentication successful');
      }

      return result;
    } catch (error) {
      console.error('❌ GP51 Authentication failed:', error);
      return {
        status: -1,
        cause: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  private async storeSession(username: string, token: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('gp51_sessions')
        .upsert({
          username,
          gp51_token: token,
          token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          last_activity_at: new Date().toISOString()
        }, {
          onConflict: 'username'
        });

      if (error) {
        console.error('Failed to store GP51 session:', error);
      }
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  async loadExistingSession(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('gp51_sessions')
        .select('gp51_token, token_expires_at')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return false;
      }

      const expiresAt = new Date(data.token_expires_at);
      if (expiresAt <= new Date()) {
        return false;
      }

      this.currentSession = {
        username,
        token: data.gp51_token,
        expiresAt
      };

      return true;
    } catch (error) {
      console.error('Error loading existing session:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    if (this.currentSession) {
      // Mark session as inactive in database
      await supabase
        .from('gp51_sessions')
        .update({ is_active: false })
        .eq('username', this.currentSession.username);
    }
    
    this.currentSession = null;
  }

  async fetchAllUsers(): Promise<GP51User[]> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      const url = new URL(this.API_BASE_URL);
      url.searchParams.append('action', 'querymonitorlist');
      url.searchParams.append('token', this.currentToken!);

      const response = await fetch(url.toString());
      const result = await response.json();

      if (result.status === 0 && result.users) {
        return result.users;
      }

      return [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async fetchAllDevices(): Promise<GP51Device[]> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      const url = new URL(this.API_BASE_URL);
      url.searchParams.append('action', 'querymonitorlist');
      url.searchParams.append('token', this.currentToken!);

      const response = await fetch(url.toString());
      const result = await response.json();

      if (result.status === 0 && result.devices) {
        return result.devices;
      }

      return [];
    } catch (error) {
      console.error('Error fetching devices:', error);
      return [];
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<any[]> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      const url = new URL(this.API_BASE_URL);
      url.searchParams.append('action', 'lastposition');
      url.searchParams.append('token', this.currentToken!);

      const body = {
        deviceids: deviceIds || [],
        lastquerypositiontime: 0
      };

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.status === 0 && result.records) {
        return result.records;
      }

      return [];
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  }

  async sendVehicleCommand(deviceId: string, command: string, parameters: any[] = []): Promise<GP51AuthResult> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      const url = new URL(this.API_BASE_URL);
      url.searchParams.append('action', 'devicecommand');
      url.searchParams.append('token', this.currentToken!);

      const body = {
        deviceid: deviceId,
        command: command,
        parameters: parameters
      };

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        status: -1,
        cause: error instanceof Error ? error.message : 'Command failed'
      };
    }
  }

  async registerUser(userData: {
    username: string;
    password: string;
    email?: string;
    companyname?: string;
    cardname?: string;
    phone?: string;
  }): Promise<GP51AuthResult> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      const url = new URL(this.API_BASE_URL);
      url.searchParams.append('action', 'adduser');
      url.searchParams.append('token', this.currentToken!);

      const body = {
        ...userData,
        password: md5(userData.password),
        creater: this.currentUsername,
        usertype: 11, // End user
        multilogin: 1
      };

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        status: -1,
        cause: error instanceof Error ? error.message : 'User registration failed'
      };
    }
  }

  async registerDevice(deviceData: {
    deviceid: string;
    devicename: string;
    devicetype: number;
    creater: string;
  }): Promise<GP51AuthResult> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      const url = new URL(this.API_BASE_URL);
      url.searchParams.append('action', 'adddevice');
      url.searchParams.append('token', this.currentToken!);

      const body = {
        ...deviceData,
        groupid: 1,
        deviceenable: 1,
        timezone: 8
      };

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        status: -1,
        cause: error instanceof Error ? error.message : 'Device registration failed'
      };
    }
  }
}

export const productionGP51Service = ProductionGP51Service.getInstance();
