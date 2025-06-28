
import { GPS51PasswordService } from './GPS51PasswordService';
import { GPS51SecurityService } from './GPS51SecurityService';

export interface GPS51LoginRequest {
  username: string;
  password: string;
  from?: 'WEB' | 'ANDROID' | 'IPHONE' | 'WEIXIN';
  type?: 'USER' | 'DEVICE';
}

export interface GPS51LoginResponse {
  status: number;
  cause?: string;
  token?: string;
  username?: string;
  usertype?: number;
  nickname?: string;
  email?: string;
}

export interface GPS51ConnectionTest {
  success: boolean;
  responseTime: number;
  error?: string;
  details?: any;
}

export class GPS51ApiClient {
  private baseUrl = 'https://www.gps51.com/webapi';
  private timeout = 30000; // 30 seconds
  private currentToken: string | null = null;

  /**
   * Login to GPS51 API with secure password hashing
   */
  async login(request: GPS51LoginRequest): Promise<GPS51LoginResponse> {
    const identifier = request.username;
    
    // Check rate limiting
    const rateLimitCheck = GPS51SecurityService.checkRateLimit(identifier);
    if (!rateLimitCheck.allowed) {
      GPS51SecurityService.recordFailedAttempt(identifier);
      throw new Error(`Too many attempts. Try again later. Remaining attempts: ${rateLimitCheck.remainingAttempts}`);
    }

    // Validate inputs
    const usernameValidation = GPS51SecurityService.validateInput(request.username, 'username');
    if (!usernameValidation.isValid) {
      throw new Error(`Invalid username: ${usernameValidation.error}`);
    }

    const passwordValidation = GPS51PasswordService.validatePassword(request.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Invalid password: ${passwordValidation.error}`);
    }

    // Hash password using GPS51 requirements
    const hashResult = GPS51PasswordService.createPasswordHash(request.password);
    if (!hashResult.isValid) {
      throw new Error(`Password hashing failed: ${hashResult.error}`);
    }

    const requestBody = {
      action: 'login',
      username: request.username,
      password: hashResult.hash, // MD5 hashed password
      from: request.from || 'WEB',
      type: request.type || 'USER'
    };

    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.baseUrl}?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GPS51-Integration/1.0',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        GPS51SecurityService.recordFailedAttempt(identifier);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GPS51LoginResponse = await response.json();
      
      // Handle GPS51 response
      if (result.status === 0) {
        // Success
        GPS51SecurityService.recordSuccessfulAttempt(identifier);
        if (result.token) {
          this.currentToken = result.token;
        }
        
        console.log(`✅ GPS51 login successful for ${request.username} (${Date.now() - startTime}ms)`);
        return result;
      } else {
        // GPS51 API error
        GPS51SecurityService.recordFailedAttempt(identifier);
        console.error(`❌ GPS51 login failed: ${result.cause || 'Unknown error'}`);
        throw new Error(result.cause || 'Login failed');
      }

    } catch (error) {
      GPS51SecurityService.recordFailedAttempt(identifier);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - GPS51 server did not respond');
        }
        throw error;
      }
      
      throw new Error('Login request failed');
    }
  }

  /**
   * Test connection to GPS51 API
   */
  async testConnection(): Promise<GPS51ConnectionTest> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout)
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          success: true,
          responseTime,
          details: {
            status: response.status,
            statusText: response.statusText
          }
        };
      } else {
        return {
          success: false,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.currentToken;
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.currentToken = token;
  }

  /**
   * Clear authentication token
   */
  clearToken(): void {
    this.currentToken = null;
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentToken !== null;
  }
}
