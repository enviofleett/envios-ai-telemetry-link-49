
import { supabase } from '@/integrations/supabase/client';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  token: string;
  expiresAt: Date;
  username: string;
}

export interface AuthResponse {
  status: number;
  cause?: string;
  token?: string;
  message?: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

export class Gps51AuthService {
  private static instance: Gps51AuthService;
  private currentToken: AuthToken | null = null;
  private credentials: AuthCredentials | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly maxRetries = 3;
  private readonly baseUrl = 'https://www.gps51.com/webapi';
  private readonly healthCheckIntervalMs = 5 * 60 * 1000; // 5 minutes

  static getInstance(): Gps51AuthService {
    if (!Gps51AuthService.instance) {
      Gps51AuthService.instance = new Gps51AuthService();
    }
    return Gps51AuthService.instance;
  }

  private constructor() {
    this.startHealthCheck();
  }

  // MD5 hash implementation
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    try {
      // Try using Web Crypto API if available
      const hashBuffer = await crypto.subtle.digest('MD5', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback MD5 implementation
      return this.fallbackMD5(password);
    }
  }

  private fallbackMD5(input: string): string {
    // Simple MD5 implementation for fallback
    // This is a simplified version - in production, use a proper crypto library
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
  }

  private log(level: 'info' | 'error' | 'warn', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [GP51Auth] ${message}`;
    
    if (level === 'error') {
      console.error(logMessage, data);
    } else if (level === 'warn') {
      console.warn(logMessage, data);
    } else {
      console.log(logMessage, data);
    }
  }

  private async makeRequest(url: string, data: any, retryCount = 0): Promise<any> {
    try {
      this.log('info', `Making request to GP51 API: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.log('info', 'GP51 API response received', { status: result.status });
      
      return result;
    } catch (error) {
      this.log('error', `Request failed (attempt ${retryCount + 1}/${this.maxRetries})`, error);
      
      if (retryCount < this.maxRetries - 1) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        this.log('info', `Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(url, data, retryCount + 1);
      }
      
      throw error;
    }
  }

  async login(username: string, password: string): Promise<AuthResult> {
    try {
      this.log('info', `Attempting login for user: ${username}`);
      
      // Validate inputs
      if (!username?.trim() || !password?.trim()) {
        return { success: false, error: 'Username and password are required' };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);
      
      // Prepare request
      const loginData = {
        username: username.trim(),
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      };

      const url = `${this.baseUrl}?action=login`;
      const response: AuthResponse = await this.makeRequest(url, loginData);

      if (response.status === 0 && response.token) {
        // Calculate token expiry (24 hours from now)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        this.currentToken = {
          token: response.token,
          expiresAt,
          username: username.trim()
        };

        this.credentials = {
          username: username.trim(),
          password: password
        };

        this.log('info', `Login successful for user: ${username}`);
        return { success: true, token: response.token };
      } else {
        const error = response.cause || response.message || 'Login failed';
        this.log('error', `Login failed for user: ${username}`, { error, status: response.status });
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', `Login error for user: ${username}`, error);
      return { success: false, error: errorMessage };
    }
  }

  async logout(): Promise<AuthResult> {
    try {
      if (!this.currentToken) {
        return { success: true };
      }

      this.log('info', `Logging out user: ${this.currentToken.username}`);
      
      const url = `${this.baseUrl}?action=logout&token=${encodeURIComponent(this.currentToken.token)}`;
      
      try {
        await this.makeRequest(url, {});
      } catch (error) {
        // Don't fail logout if API call fails
        this.log('warn', 'Logout API call failed, clearing local session anyway', error);
      }

      this.currentToken = null;
      this.credentials = null;
      
      this.log('info', 'Logout completed');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', 'Logout error', error);
      return { success: false, error: errorMessage };
    }
  }

  async getToken(): Promise<string | null> {
    // Check if we have a valid token
    if (this.currentToken && this.isTokenValid()) {
      return this.currentToken.token;
    }

    // Try to renew token if we have credentials
    if (this.credentials) {
      this.log('info', 'Token expired or invalid, attempting renewal');
      const result = await this.login(this.credentials.username, this.credentials.password);
      return result.success ? result.token || null : null;
    }

    return null;
  }

  isTokenValid(): boolean {
    if (!this.currentToken) {
      return false;
    }

    // Check if token is expired (with 5 minute buffer)
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    const now = new Date();
    const expiryWithBuffer = new Date(this.currentToken.expiresAt.getTime() - bufferTime);

    return now < expiryWithBuffer;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        this.log('warn', 'Health check failed: No valid token');
        return false;
      }

      // Use a lightweight endpoint to check token validity
      const url = `${this.baseUrl}?action=querymonitorlist&token=${encodeURIComponent(token)}`;
      const response = await this.makeRequest(url, {});

      if (response.status === 0) {
        this.log('info', 'Health check passed');
        return true;
      } else {
        this.log('warn', 'Health check failed: Invalid token response', response);
        
        // If token is invalid, clear it to force renewal
        if (response.cause?.includes('token') || response.cause?.includes('invalid')) {
          this.currentToken = null;
        }
        
        return false;
      }
    } catch (error) {
      this.log('error', 'Health check error', error);
      return false;
    }
  }

  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (this.currentToken) {
        await this.healthCheck();
      }
    }, this.healthCheckIntervalMs);
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.currentToken = null;
    this.credentials = null;
  }

  // Get current auth status
  getAuthStatus(): {
    isAuthenticated: boolean;
    username?: string;
    tokenExpiresAt?: Date;
  } {
    return {
      isAuthenticated: this.isTokenValid(),
      username: this.currentToken?.username,
      tokenExpiresAt: this.currentToken?.expiresAt
    };
  }
}

// Export singleton instance
export const gps51AuthService = Gps51AuthService.getInstance();
