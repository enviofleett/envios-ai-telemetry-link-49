
import { gps51SessionManager } from './GPS51SessionManager';

export interface GPS51AuthResult {
  success: boolean;
  error?: string;
  username?: string;
}

export class GPS51AuthService {
  private static instance: GPS51AuthService;
  
  static getInstance(): GPS51AuthService {
    if (!GPS51AuthService.instance) {
      GPS51AuthService.instance = new GPS51AuthService();
    }
    return GPS51AuthService.instance;
  }

  async login(username: string, password: string): Promise<GPS51AuthResult> {
    try {
      console.log(`🔐 GPS51 Authentication for: ${username}`);
      
      const result = await gps51SessionManager.login(username, password);
      
      if (result.success) {
        console.log('✅ GPS51 authentication successful');
        return {
          success: true,
          username
        };
      }
      
      return {
        success: false,
        error: result.error || 'Authentication failed'
      };
    } catch (error) {
      console.error('❌ GPS51 authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('👋 GPS51 logout initiated');
      await gps51SessionManager.logout();
      console.log('✅ GPS51 logout completed');
    } catch (error) {
      console.error('❌ GPS51 logout error:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const isValid = await gps51SessionManager.validateSession();
      console.log(`🔍 GPS51 session valid: ${isValid}`);
      return isValid;
    } catch (error) {
      console.error('❌ GPS51 session validation error:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<string | null> {
    const session = gps51SessionManager.getSession();
    return session?.username || null;
  }

  async refreshSession(): Promise<boolean> {
    try {
      return await gps51SessionManager.refreshSession();
    } catch (error) {
      console.error('❌ GPS51 session refresh error:', error);
      return false;
    }
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'unknown' {
    const session = gps51SessionManager.getSession();
    if (!session) return 'disconnected';
    
    const now = Date.now();
    const isExpired = now >= session.expiresAt;
    const isStale = (now - session.lastActivity) > (30 * 60 * 1000); // 30 minutes
    
    if (isExpired || isStale) return 'disconnected';
    return 'connected';
  }
}

export const gps51AuthService = GPS51AuthService.getInstance();
