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
  private currentToken: string | null = null;
  private currentUsername: string | null = null;
  private tokenExpiry: Date | null = null;
  private apiUrl: string = 'https://www.gps51.com/webapi';

  private constructor() {}

  static getInstance(): ProductionGP51Service {
    if (!ProductionGP51Service.instance) {
      ProductionGP51Service.instance = new ProductionGP51Service();
    }
    return ProductionGP51Service.instance;
  }

  get isAuthenticated(): boolean {
    return this.currentToken !== null && this.tokenExpiry !== null && this.tokenExpiry > new Date();
  }

  get currentUsername(): string | null {
    return this.currentUsername;
  }

  async authenticate(username: string, password: string): Promise<GP51AuthResult> {
    try {
      console.log(`🔐 Authenticating ${username} with GP51...`);
      
      const hashedPassword = this.hashMD5(password);
      
      const response = await fetch(`${this.apiUrl}?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 0) {
        this.currentToken = result.token;
        this.currentUsername = username;
        this.tokenExpiry = new Date(Date.now() + (result.tokenExpiry || 24 * 60 * 60 * 1000));
        
        // Store session in database with required fields
        await this.storeSession(username, hashedPassword, result.token);
        
        console.log('✅ GP51 authentication successful');
        return {
          status: 0,
          token: result.token,
          expires_at: this.tokenExpiry.toISOString(),
          username: username
        };
      } else {
        console.error('❌ GP51 authentication failed:', result.cause);
        return {
          status: result.status,
          cause: result.cause || 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('❌ GP51 authentication error:', error);
      return {
        status: -1,
        cause: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async storeSession(username: string, passwordHash: string, token: string): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      await supabase
        .from('gp51_sessions')
        .upsert({
          username,
          password_hash: passwordHash,
          gp51_token: token,
          token_expires_at: this.tokenExpiry?.toISOString() || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          last_activity_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to store session in database:', error);
    }
  }

  async loadExistingSession(username: string): Promise<boolean> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data: session } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (session && session.token_expires_at && new Date(session.token_expires_at) > new Date()) {
        this.currentToken = session.gp51_token;
        this.currentUsername = session.username;
        this.tokenExpiry = new Date(session.token_expires_at);
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Failed to load existing session:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    this.currentToken = null;
    this.currentUsername = null;
    this.tokenExpiry = null;
  }

  async fetchAllUsers(): Promise<GP51User[]> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      const url = new URL(this.apiUrl);
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
      const url = new URL(this.apiUrl);
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
      const url = new URL(this.apiUrl);
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
      const url = new URL(this.apiUrl);
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
      const url = new URL(this.apiUrl);
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
      const url = new URL(this.apiUrl);
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

  private hashMD5(input: string): string {
    try {
      // Simple hash implementation for browsers
      const crypto = require('crypto');
      return crypto.createHash('md5').update(input).digest('hex');
    } catch (error) {
      // Fallback for environments without crypto
      console.warn('MD5 hashing not available, using plain text (NOT FOR PRODUCTION)');
      return input;
    }
  }
}

export const productionGP51Service = ProductionGP51Service.getInstance();
