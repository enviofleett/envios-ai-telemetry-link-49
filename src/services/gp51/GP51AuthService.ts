
import type { GP51AuthResponse } from '@/types/gp51-unified';
import { supabase } from '@/integrations/supabase/client';

export class GP51AuthService {
  private token: string | null = null;
  private _session: any = null;
  private readonly STORAGE_KEY = 'envios_gp51_session_encrypted';

  get isAuthenticated(): boolean {
    return !!this.token && !!this._session;
  }

  public getSession() {
    return this._session;
  }

  // Secure session encryption using Web Crypto API
  private async encryptSession(session: any): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(session));
      
      // Generate encryption key
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt data
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      // Export and store key (in production, use more secure key management)
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      sessionStorage.setItem('gp51_enc_key', btoa(String.fromCharCode(...new Uint8Array(exportedKey))));
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Session encryption failed:', error);
      // Fallback to base64 encoding
      return btoa(JSON.stringify(session));
    }
  }

  private async decryptSession(encryptedData: string): Promise<any> {
    try {
      const keyData = sessionStorage.getItem('gp51_enc_key');
      if (!keyData) {
        // Try fallback decryption
        return JSON.parse(atob(encryptedData));
      }

      // Import key
      const keyBytes = new Uint8Array(atob(keyData).split('').map(c => c.charCodeAt(0)));
      const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Split IV and encrypted data
      const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
      console.error('Session decryption failed:', error);
      // Try fallback decryption
      try {
        return JSON.parse(atob(encryptedData));
      } catch {
        return null;
      }
    }
  }

  async authenticate(username: string, password: string): Promise<GP51AuthResponse> {
    try {
      // Input validation
      if (!username || !password) {
        return {
          status: 1,
          cause: 'Username and password are required',
          success: false,
          error: 'Missing credentials'
        };
      }

      // Sanitize inputs
      const cleanUsername = username.trim();
      if (cleanUsername.length < 3 || cleanUsername.length > 50) {
        return {
          status: 1,
          cause: 'Invalid username length',
          success: false,
          error: 'Username must be between 3 and 50 characters'
        };
      }

      if (password.length < 6 || password.length > 100) {
        return {
          status: 1,
          cause: 'Invalid password length',
          success: false,
          error: 'Password must be between 6 and 100 characters'
        };
      }

      console.log('🔐 Authenticating with GP51 via secure edge function...');
      
      // Call secure Supabase edge function
      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: {
          username: cleanUsername,
          password: password,
          apiUrl: 'https://www.gps51.com/webapi'
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        return {
          status: 1,
          cause: error.message || 'Authentication service error',
          success: false,
          error: error.message || 'Authentication service error'
        };
      }

      if (!data?.success) {
        console.error('❌ Authentication failed:', data?.error);
        return {
          status: 1,
          cause: data?.error || 'Authentication failed',
          success: false,
          error: data?.error || 'Authentication failed'
        };
      }

      // Success - store session securely
      this.token = data.token;
      this._session = {
        username: data.username,
        token: data.token,
        sessionToken: data.sessionToken,
        apiUrl: data.apiUrl,
        loginTime: new Date(data.loginTime),
        expiresAt: new Date(data.expiresAt)
      };

      // Encrypt and store session
      const encryptedSession = await this.encryptSession(this._session);
      localStorage.setItem(this.STORAGE_KEY, encryptedSession);

      console.log('✅ GP51 authentication successful for user:', data.username);
      
      return {
        status: 0,
        cause: 'Authentication successful',
        token: data.token,
        success: true
      };

    } catch (error) {
      console.error('❌ Authentication error:', error);
      return {
        status: 1,
        cause: error instanceof Error ? error.message : 'Authentication failed',
        success: false,
        error: error instanceof Error ? error.message : 'Authentication network error'
      };
    }
  }

  async loadExistingSession(): Promise<boolean> {
    try {
      const encryptedSession = localStorage.getItem(this.STORAGE_KEY);
      if (!encryptedSession) {
        console.log('No stored session found');
        return false;
      }

      const session = await this.decryptSession(encryptedSession);
      if (!session) {
        console.log('Failed to decrypt stored session');
        await this.clearStoredSession();
        return false;
      }

      // Check if session is expired
      const expiresAt = new Date(session.expiresAt);
      if (new Date() >= expiresAt) {
        console.log('Stored session expired');
        await this.clearStoredSession();
        return false;
      }

      this.token = session.token;
      this._session = session;
      
      console.log('✅ Loaded existing GP51 session for user:', session.username);
      return true;
    } catch (error) {
      console.error('Error loading session:', error);
      await this.clearStoredSession();
      return false;
    }
  }

  private async clearStoredSession(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem('gp51_enc_key');
    this.token = null;
    this._session = null;
  }

  async disconnect(): Promise<void> {
    await this.logout();
  }

  async logout(): Promise<void> {
    try {
      // Clear local session data
      await this.clearStoredSession();
      console.log('✅ GP51 session cleared');
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear even if error
      await this.clearStoredSession();
    }
  }

  // Helper method for making authenticated requests to GP51 data services
  getAuthHeaders(): Record<string, string> {
    if (!this._session) {
      throw new Error('Not authenticated - no session available');
    }

    return {
      'Authorization': `Bearer ${this._session.sessionToken}`,
      'X-GP51-Token': this._session.token,
      'X-GP51-Username': this._session.username,
      'Content-Type': 'application/json'
    };
  }

  // Validate session before API calls
  isSessionValid(): boolean {
    if (!this._session || !this.token) {
      return false;
    }

    const expiresAt = new Date(this._session.expiresAt);
    return new Date() < expiresAt;
  }
}

export const gp51AuthService = new GP51AuthService();
