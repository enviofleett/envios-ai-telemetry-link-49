
import { supabase } from '@/integrations/supabase/client';

export interface AuthResult {
  success: boolean;
  error?: string;
  token?: string;
  username?: string;
  expiresAt?: Date;
}

interface AuthSession {
  token: string;
  username: string;
  password: string;
  expiresAt: Date;
  apiUrl: string;
}

interface QueuedRequest {
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}

export class Gps51AuthService {
  private static instance: Gps51AuthService;
  private session: AuthSession | null = null;
  private isRefreshing = false;
  private refreshQueue: QueuedRequest[] = [];
  private refreshBuffer = 5 * 60 * 1000; // 5 minutes buffer before token expiry

  private constructor() {
    this.loadSession();
    this.startPeriodicRefresh();
  }

  public static getInstance(): Gps51AuthService {
    if (!Gps51AuthService.instance) {
      Gps51AuthService.instance = new Gps51AuthService();
    }
    return Gps51AuthService.instance;
  }

  private loadSession(): void {
    try {
      const sessionData = localStorage.getItem('gp51_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        this.session = {
          ...parsed,
          expiresAt: new Date(parsed.expiresAt)
        };
        
        // Check if session is still valid
        if (this.isSessionExpired()) {
          console.log('🔄 Loaded session is expired, clearing...');
          this.clearSession();
        } else {
          console.log('✅ Loaded valid session from storage');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load session from storage:', error);
      this.clearSession();
    }
  }

  private saveSession(): void {
    if (this.session) {
      try {
        localStorage.setItem('gp51_session', JSON.stringify(this.session));
      } catch (error) {
        console.error('❌ Failed to save session to storage:', error);
      }
    }
  }

  private clearSession(): void {
    this.session = null;
    localStorage.removeItem('gp51_session');
  }

  private isSessionExpired(): boolean {
    if (!this.session) return true;
    return new Date() >= this.session.expiresAt;
  }

  private shouldRefreshToken(): boolean {
    if (!this.session) return false;
    const timeUntilExpiry = this.session.expiresAt.getTime() - new Date().getTime();
    return timeUntilExpiry <= this.refreshBuffer;
  }

  private processQueue(error: any | null, token: string | null = null): void {
    this.refreshQueue.forEach(request => {
      if (error) {
        request.reject(error);
      } else {
        request.resolve(token);
      }
    });
    this.refreshQueue = [];
  }

  private async refreshToken(): Promise<string | null> {
    if (!this.session) {
      throw new Error('No session available for refresh');
    }

    console.log('🔄 Refreshing GP51 token...');

    try {
      const { data, error } = await supabase.functions.invoke('gp51-auth-service', {
        body: {
          action: 'test_authentication',
          username: this.session.username,
          password: this.session.password
        }
      });

      if (error) throw error;

      if (data.success && data.token) {
        // Update session with new token and extended expiry
        this.session.token = data.token;
        this.session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        this.saveSession();
        
        console.log('✅ Token refreshed successfully');
        return data.token;
      } else {
        throw new Error(data.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.clearSession();
      throw error;
    }
  }

  private startPeriodicRefresh(): void {
    // Check every 5 minutes if token needs refresh
    setInterval(async () => {
      if (this.session && this.shouldRefreshToken() && !this.isRefreshing) {
        try {
          await this.getToken();
        } catch (error) {
          console.error('❌ Periodic token refresh failed:', error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  public async login(username: string, password: string): Promise<AuthResult> {
    console.log(`🔐 Logging in to GP51 as: ${username}`);

    try {
      const { data, error } = await supabase.functions.invoke('gp51-auth-service', {
        body: {
          action: 'test_authentication',
          username: username.trim(),
          password: password
        }
      });

      if (error) throw error;

      if (data.success && data.token) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        this.session = {
          token: data.token,
          username: username.trim(),
          password: password, // Store for auto-refresh
          expiresAt,
          apiUrl: 'https://www.gps51.com/webapi'
        };
        
        this.saveSession();
        
        console.log('✅ GP51 login successful');
        return {
          success: true,
          token: data.token,
          username: username.trim(),
          expiresAt
        };
      } else {
        return {
          success: false,
          error: data.error || 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('❌ GP51 login failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  public async logout(): Promise<AuthResult> {
    console.log('👋 Logging out from GP51...');
    this.clearSession();
    return { success: true };
  }

  public async getToken(): Promise<string | null> {
    // If no session, return null
    if (!this.session) {
      return null;
    }

    // If token is still valid and doesn't need refresh
    if (!this.isSessionExpired() && !this.shouldRefreshToken()) {
      return this.session.token;
    }

    // If already refreshing, queue the request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    // Start refresh process
    this.isRefreshing = true;

    try {
      const newToken = await this.refreshToken();
      this.processQueue(null, newToken);
      return newToken;
    } catch (error) {
      this.processQueue(error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  public getAuthStatus(): { isAuthenticated: boolean; username?: string; tokenExpiresAt?: Date } {
    if (!this.session || this.isSessionExpired()) {
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      username: this.session.username,
      tokenExpiresAt: this.session.expiresAt
    };
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }
}

export const gps51AuthService = Gps51AuthService.getInstance();
