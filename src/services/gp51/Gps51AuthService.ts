import { supabase } from '@/integrations/supabase/client';

export class GP51AuthService {
  private static readonly TOKEN_STORAGE_KEY = 'gp51_auth_token';
  private static readonly USERNAME_STORAGE_KEY = 'gp51_username';
  private static readonly EXPIRES_STORAGE_KEY = 'gp51_token_expires';

  constructor() {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage is not available in this environment');
    }
  }

  public async authenticate(username: string, passwordPlain: string): Promise<{ token: string; expiresAt: Date } | null> {
    // Simulate authentication and token retrieval
    const token = this.generateMockToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expires in 24 hours

    this.saveToLocalStorage(token, username, expiresAt);

    return { token, expiresAt };
  }

  private generateMockToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private saveToLocalStorage(token: string, username: string, expiresAt: Date): void {
    localStorage.setItem(GP51AuthService.TOKEN_STORAGE_KEY, token);
    localStorage.setItem(GP51AuthService.USERNAME_STORAGE_KEY, username);
    localStorage.setItem(GP51AuthService.EXPIRES_STORAGE_KEY, expiresAt.toISOString());
  }

  public isTokenExpired(): boolean {
    const expiresAtStr = localStorage.getItem(GP51AuthService.EXPIRES_STORAGE_KEY);
    if (!expiresAtStr) {
      return true;
    }

    const expiresAt = new Date(expiresAtStr);
    return expiresAt <= new Date();
  }

  public getStoredToken(): string | null {
    return localStorage.getItem(GP51AuthService.TOKEN_STORAGE_KEY);
  }

  public clearAuthData(): void {
    localStorage.removeItem(GP51AuthService.TOKEN_STORAGE_KEY);
    localStorage.removeItem(GP51AuthService.USERNAME_STORAGE_KEY);
    localStorage.removeItem(GP51AuthService.EXPIRES_STORAGE_KEY);
  }

  public getStoredCredentials(): { token: string; username: string; expiresAt: Date } | null {
    const token = localStorage.getItem(GP51AuthService.TOKEN_STORAGE_KEY);
    const username = localStorage.getItem(GP51AuthService.USERNAME_STORAGE_KEY);
    const expiresAtStr = localStorage.getItem(GP51AuthService.EXPIRES_STORAGE_KEY);

    if (!token || !username || !expiresAtStr) {
      return null;
    }

    const expiresAt = new Date(expiresAtStr);
    return { token, username, expiresAt };
  }
}
