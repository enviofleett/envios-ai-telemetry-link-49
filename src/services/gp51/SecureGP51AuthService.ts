
import { supabase } from '@/integrations/supabase/client';
import { AuditLogger } from '@/services/auditLogging/AuditLogger';

export interface SecureAuthResult {
  success: boolean;
  error?: string;
  sessionData?: {
    username: string;
    apiUrl: string;
    expiresAt: Date;
  };
}

export interface GP51AuthStatus {
  isAuthenticated: boolean;
  username?: string;
  apiUrl?: string;
  lastValidated?: Date;
}

/**
 * Secure GP51 Authentication Service using Supabase Vault
 * Replaces all legacy authentication methods with vault-based storage
 */
export class SecureGP51AuthService {
  private static instance: SecureGP51AuthService;
  private authCache: GP51AuthStatus | null = null;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): SecureGP51AuthService {
    if (!SecureGP51AuthService.instance) {
      SecureGP51AuthService.instance = new SecureGP51AuthService();
    }
    return SecureGP51AuthService.instance;
  }

  /**
   * Authenticate with GP51 using secure vault storage
   */
  async authenticate(username: string, password: string, apiUrl?: string): Promise<SecureAuthResult> {
    try {
      console.log('🔐 Starting secure GP51 authentication...');

      // Store credentials securely in vault
      const { data: credentialId, error: storeError } = await supabase
        .rpc('store_gp51_credentials', {
          p_username: username,
          p_password: password,
          p_api_url: apiUrl || 'https://www.gps51.com/webapi'
        });

      if (storeError) {
        await this.logAuthAttempt(username, false, storeError.message);
        throw new Error(`Failed to store credentials: ${storeError.message}`);
      }

      // Test authentication with GP51 API
      const authResult = await this.testGP51Connection(username, password, apiUrl);
      
      if (!authResult.success) {
        await this.logAuthAttempt(username, false, authResult.error);
        return authResult;
      }

      // Update validation status
      await this.updateValidationStatus(credentialId, true);
      await this.logAuthAttempt(username, true);

      // Update cache
      this.authCache = {
        isAuthenticated: true,
        username,
        apiUrl: apiUrl || 'https://www.gps51.com/webapi',
        lastValidated: new Date()
      };

      console.log('✅ Secure GP51 authentication successful');
      return {
        success: true,
        sessionData: {
          username,
          apiUrl: apiUrl || 'https://www.gps51.com/webapi',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      console.error('❌ Secure GP51 authentication failed:', errorMessage);
      await this.logAuthAttempt(username, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get current authentication status
   */
  async getAuthStatus(): Promise<GP51AuthStatus> {
    // Return cached status if still valid
    if (this.authCache && this.isCacheValid()) {
      return this.authCache;
    }

    try {
      // Check for active credentials in vault
      const { data: credentials, error } = await supabase
        .rpc('get_gp51_credentials');

      if (error || !credentials || credentials.length === 0) {
        this.authCache = { isAuthenticated: false };
        return this.authCache;
      }

      const cred = credentials[0];
      this.authCache = {
        isAuthenticated: cred.is_active,
        username: cred.username,
        apiUrl: cred.api_url,
        lastValidated: new Date()
      };

      return this.authCache;

    } catch (error) {
      console.error('❌ Failed to get auth status:', error);
      this.authCache = { isAuthenticated: false };
      return this.authCache;
    }
  }

  /**
   * Get secure credentials for API calls
   */
  async getSecureCredentials(): Promise<{ username: string; password: string; apiUrl: string } | null> {
    try {
      const { data: credentials, error } = await supabase
        .rpc('get_gp51_credentials');

      if (error || !credentials || credentials.length === 0) {
        return null;
      }

      const cred = credentials[0];
      return {
        username: cred.username,
        password: cred.password,
        apiUrl: cred.api_url
      };

    } catch (error) {
      console.error('❌ Failed to get secure credentials:', error);
      return null;
    }
  }

  /**
   * Logout and clear credentials
   */
  async logout(): Promise<void> {
    try {
      console.log('👋 Logging out from GP51...');

      // Deactivate credentials instead of deleting (for audit trail)
      const { error } = await supabase
        .from('gp51_secure_credentials')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        console.error('❌ Logout error:', error);
      }

      // Clear cache
      this.authCache = { isAuthenticated: false };

      await AuditLogger.logSecurityEvent({
        actionType: 'logout',
        success: true,
        requestDetails: { service: 'gp51' }
      });

      console.log('✅ GP51 logout successful');

    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  }

  /**
   * Test GP51 API connection
   */
  private async testGP51Connection(username: string, password: string, apiUrl?: string): Promise<SecureAuthResult> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: {
          action: 'test_connection',
          username,
          password,
          apiUrl: apiUrl || 'https://www.gps51.com/webapi'
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data.success 
        ? { success: true }
        : { success: false, error: data.error || 'Connection test failed' };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }

  /**
   * Update credential validation status
   */
  private async updateValidationStatus(credentialId: string, isValid: boolean): Promise<void> {
    const { error } = await supabase
      .from('gp51_secure_credentials')
      .update({
        validation_status: isValid ? 'valid' : 'invalid',
        last_validated_at: new Date().toISOString()
      })
      .eq('id', credentialId);

    if (error) {
      console.error('❌ Failed to update validation status:', error);
    }
  }

  /**
   * Log authentication attempts
   */
  private async logAuthAttempt(username: string, success: boolean, errorMessage?: string): Promise<void> {
    await AuditLogger.logSecurityEvent({
      actionType: success ? 'login' : 'failed_login',
      success,
      errorMessage,
      requestDetails: { 
        service: 'gp51',
        username,
        timestamp: new Date().toISOString()
      },
      riskLevel: success ? 'low' : 'medium'
    });
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return this.authCache?.lastValidated && 
           (Date.now() - this.authCache.lastValidated.getTime()) < this.cacheExpiry;
  }

  /**
   * Clear authentication cache
   */
  clearCache(): void {
    this.authCache = null;
  }
}

export const secureGP51AuthService = SecureGP51AuthService.getInstance();
