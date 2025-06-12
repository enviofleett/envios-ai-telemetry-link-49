import { supabase } from '@/integrations/supabase/client';
import { crossBrowserMD5 } from './crossBrowserMD5';

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

// Token storage keys
const GP51_TOKEN_STORAGE_KEY = 'gp51_auth_token';
const GP51_TOKEN_EXPIRY_STORAGE_KEY = 'gp51_token_expiry';
const GP51_USERNAME_STORAGE_KEY = 'gp51_username';

export class Gps51AuthService {
  private static instance: Gps51AuthService;
  private currentToken: AuthToken | null = null;
  private credentials: AuthCredentials | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly maxRetries = 3;
  private readonly baseUrl = 'https://www.gps51.com/webapi';
  private readonly healthCheckIntervalMs = 5 * 60 * 1000; // 5 minutes
  private readonly requestTimeoutMs = 10000; // 10 seconds

  static getInstance(): Gps51AuthService {
    if (!Gps51AuthService.instance) {
      Gps51AuthService.instance = new Gps51AuthService();
    }
    return Gps51AuthService.instance;
  }

  private constructor() {
    this.loadTokenFromStorage();
    this.startHealthCheck();
  }

  // Load stored token from localStorage on service initialization
  private loadTokenFromStorage(): void {
    try {
      const storedToken = localStorage.getItem(GP51_TOKEN_STORAGE_KEY);
      const storedExpiry = localStorage.getItem(GP51_TOKEN_EXPIRY_STORAGE_KEY);
      const storedUsername = localStorage.getItem(GP51_USERNAME_STORAGE_KEY);

      if (storedToken && storedExpiry && storedUsername) {
        const expiresAt = new Date(storedExpiry);
        
        // Check if token is still valid (with 5 minute buffer)
        const bufferTime = 5 * 60 * 1000;
        const now = new Date();
        
        if (expiresAt.getTime() - bufferTime > now.getTime()) {
          this.currentToken = {
            token: storedToken,
            expiresAt,
            username: storedUsername
          };
          
          this.log('info', `Token restored from storage for user: ${storedUsername}`);
          
          // Validate the restored token with a quick health check
          this.validateRestoredToken();
        } else {
          this.log('warn', 'Stored token expired, clearing storage');
          this.clearTokenStorage();
        }
      }
    } catch (error) {
      this.log('error', 'Failed to load token from storage', error);
      this.clearTokenStorage();
    }
  }

  // Validate restored token with a lightweight API call
  private async validateRestoredToken(): Promise<void> {
    try {
      this.log('info', 'Validating restored token...');
      const isValid = await this.healthCheck();
      
      if (!isValid) {
        this.log('warn', 'Restored token is invalid, clearing storage');
        this.clearTokenStorage();
        this.currentToken = null;
      } else {
        this.log('info', 'Restored token is valid');
      }
    } catch (error) {
      this.log('error', 'Token validation failed', error);
      this.clearTokenStorage();
      this.currentToken = null;
    }
  }

  // Store token in localStorage
  private storeTokenInStorage(token: AuthToken): void {
    try {
      localStorage.setItem(GP51_TOKEN_STORAGE_KEY, token.token);
      localStorage.setItem(GP51_TOKEN_EXPIRY_STORAGE_KEY, token.expiresAt.toISOString());
      localStorage.setItem(GP51_USERNAME_STORAGE_KEY, token.username);
      
      this.log('info', `Token stored in localStorage for user: ${token.username}`);
    } catch (error) {
      this.log('error', 'Failed to store token in localStorage', error);
    }
  }

  // Clear token from localStorage
  private clearTokenStorage(): void {
    try {
      localStorage.removeItem(GP51_TOKEN_STORAGE_KEY);
      localStorage.removeItem(GP51_TOKEN_EXPIRY_STORAGE_KEY);
      localStorage.removeItem(GP51_USERNAME_STORAGE_KEY);
      
      this.log('info', 'Token storage cleared');
    } catch (error) {
      this.log('error', 'Failed to clear token storage', error);
    }
  }

  // Use the proper cross-browser MD5 implementation
  private async hashPassword(password: string): Promise<string> {
    try {
      console.log('🔒 Hashing password for GP51 authentication...');
      const hash = await crossBrowserMD5(password);
      console.log('✅ Password hashed successfully');
      return hash;
    } catch (error) {
      console.error('❌ Password hashing failed:', error);
      throw new Error('Failed to hash password for GP51 authentication');
    }
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

  // Enhanced request method with timeout and better error handling
  private async makeRequest(url: string, data: any, retryCount = 0): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.requestTimeoutMs);

    try {
      this.log('info', `Making request to GP51 API: ${url} (attempt ${retryCount + 1}/${this.maxRetries})`);
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FleetIQ/1.0'
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      this.log('info', `GP51 API response received in ${duration}ms`, { 
        status: response.status, 
        statusText: response.statusText 
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        this.log('error', 'Failed to parse GP51 response as JSON', { responseText: responseText.substring(0, 200) });
        throw new Error('Invalid JSON response from GP51 server');
      }

      // Check GP51-specific error status
      if (result.status === 1) {
        const errorMessage = result.cause || result.message || 'GP51 internal error';
        this.log('error', `GP51 API returned error status: ${errorMessage}`, result);
        throw new Error(this.mapGP51ErrorToUserMessage(errorMessage));
      }

      this.log('info', 'GP51 API request successful', { 
        status: result.status, 
        duration: `${duration}ms` 
      });
      
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        this.log('error', `Request timed out after ${this.requestTimeoutMs}ms (attempt ${retryCount + 1})`);
        if (retryCount < this.maxRetries - 1) {
          const delay = Math.pow(2, retryCount) * 1000;
          this.log('info', `Retrying after timeout in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest(url, data, retryCount + 1);
        }
        throw new Error('GP51 connection timed out. Please check your internet connection and try again.');
      }
      
      this.log('error', `Request failed (attempt ${retryCount + 1}/${this.maxRetries})`, error);
      
      if (retryCount < this.maxRetries - 1) {
        const delay = Math.pow(2, retryCount) * 1000;
        this.log('info', `Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(url, data, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Map GP51 error messages to user-friendly messages
  private mapGP51ErrorToUserMessage(errorMessage: string): string {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('username') || lowerError.includes('user')) {
      return 'Invalid username. Please check your GP51 username and try again.';
    }
    
    if (lowerError.includes('password') || lowerError.includes('pwd')) {
      return 'Invalid password. Please check your GP51 password and try again.';
    }
    
    if (lowerError.includes('token') || lowerError.includes('session')) {
      return 'Session expired. Please log in again.';
    }
    
    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (lowerError.includes('timeout')) {
      return 'Connection timed out. Please try again.';
    }
    
    if (lowerError.includes('server') || lowerError.includes('internal')) {
      return 'GP51 server error. Please try again later.';
    }
    
    // Return original message if no specific mapping found
    return errorMessage;
  }

  async login(username: string, password: string): Promise<AuthResult> {
    try {
      this.log('info', `Attempting login for user: ${username}`);
      
      // Validate inputs
      if (!username?.trim() || !password?.trim()) {
        return { success: false, error: 'Username and password are required' };
      }

      // Hash password using the proper MD5 implementation
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

        // Store token in localStorage
        this.storeTokenInStorage(this.currentToken);

        this.log('info', `Login successful for user: ${username}`);
        return { success: true, token: response.token };
      } else {
        const error = response.cause || response.message || 'Login failed';
        this.log('error', `Login failed for user: ${username}`, { error, status: response.status });
        return { success: false, error: this.mapGP51ErrorToUserMessage(error) };
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

      // Clear everything
      this.currentToken = null;
      this.credentials = null;
      this.clearTokenStorage();
      
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
          this.clearTokenStorage();
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
