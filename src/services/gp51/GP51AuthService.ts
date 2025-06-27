
import type { GP51AuthResponse } from '@/types/gp51-unified';

export class GP51AuthService {
  private token: string | null = null;
  private _session: any = null;

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  public getSession() {
    return this._session;
  }

  async authenticate(username: string, password: string): Promise<GP51AuthResponse> {
    try {
      // Simple browser-compatible hash function
      const simpleHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      };

      const hashedPassword = simpleHash(password);
      
      const response = await fetch('https://api.gps51.com/webapi?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER'
        })
      });

      const result = await response.json();
      
      if (result.status === 0 && result.token) {
        this.token = result.token;
        this._session = {
          username,
          token: result.token,
          loginTime: new Date()
        };
        return {
          status: result.status,
          cause: result.cause,
          token: result.token,
          success: true
        };
      } else {
        return {
          status: result.status,
          cause: result.cause,
          success: false,
          error: result.cause
        };
      }
    } catch (error) {
      return {
        status: 1,
        cause: error instanceof Error ? error.message : 'Authentication failed',
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async loadExistingSession(): Promise<boolean> {
    const storedSession = localStorage.getItem('gp51_session');
    if (storedSession) {
      try {
        this._session = JSON.parse(storedSession);
        this.token = this._session.token;
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async disconnect(): Promise<void> {
    await this.logout();
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await fetch(`https://api.gps51.com/webapi?action=logout&token=${this.token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.token = null;
        this._session = null;
        localStorage.removeItem('gp51_session');
      }
    }
  }
}

export const gp51AuthService = new GP51AuthService();
