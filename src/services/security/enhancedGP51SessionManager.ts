
import { supabase } from '@/integrations/supabase/client';
import { SecurityService } from './SecurityService';
import { crossBrowserMD5 } from '@/utils/crossBrowserMD5';

export interface SecureGP51Session {
  id: string;
  username: string;
  token: string;
  expiresAt: string;
  sessionFingerprint: string;
  riskLevel: 'low' | 'medium' | 'high';
  lastValidated: Date;
  deviceInfo: Record<string, any>;
}

export interface SessionValidationResult {
  isValid: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  actionRequired?: 'challenge' | 'reauth' | 'block';
}

export interface SessionHealth {
  isHealthy: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  lastValidated: Date | null;
  issues: string[];
}

class EnhancedGP51SessionManager {
  private static instance: EnhancedGP51SessionManager;
  private currentSession: SecureGP51Session | null = null;
  private sessionStorage = new Map<string, SecureGP51Session>();

  private constructor() {}

  static getInstance(): EnhancedGP51SessionManager {
    if (!EnhancedGP51SessionManager.instance) {
      EnhancedGP51SessionManager.instance = new EnhancedGP51SessionManager();
    }
    return EnhancedGP51SessionManager.instance;
  }

  async createSecureSession(username: string, password: string): Promise<{ success: boolean; session?: SecureGP51Session; error?: string }> {
    try {
      console.log('🔐 Creating secure GP51 session...');
      
      // Hash password for storage
      const passwordHash = await crossBrowserMD5(password);
      
      // Generate session fingerprint
      const sessionFingerprint = await this.generateSessionFingerprint();
      
      // Create session data
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Store session in database
      const { data: sessionData, error: sessionError } = await supabase
        .from('gp51_sessions')
        .insert({
          envio_user_id: user.id,
          username,
          password_hash: passwordHash, // Include password_hash
          gp51_token: `secure_token_${Date.now()}`,
          token_expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (sessionError) {
        return { success: false, error: sessionError.message };
      }

      // Create secure session object
      const secureSession: SecureGP51Session = {
        id: sessionData.id,
        username,
        token: sessionData.gp51_token,
        expiresAt: sessionData.token_expires_at,
        sessionFingerprint,
        riskLevel: 'low',
        lastValidated: new Date(),
        deviceInfo: await this.collectDeviceInfo()
      };

      this.currentSession = secureSession;
      this.sessionStorage.set(secureSession.id, secureSession);

      console.log('✅ Secure GP51 session created successfully');
      return { success: true, session: secureSession };

    } catch (error) {
      console.error('❌ Failed to create secure session:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Session creation failed' 
      };
    }
  }

  private async generateSessionFingerprint(): Promise<string> {
    const fingerprint = {
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
    
    return await crossBrowserMD5(JSON.stringify(fingerprint));
  }

  private async collectDeviceInfo(): Promise<Record<string, any>> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: screen.width,
        height: screen.height
      }
    };
  }

  async validateSession(sessionId: string): Promise<SessionValidationResult> {
    try {
      const session = this.sessionStorage.get(sessionId);
      if (!session) {
        return {
          isValid: false,
          riskLevel: 'high',
          reasons: ['Session not found'],
          actionRequired: 'reauth'
        };
      }

      // Check expiration
      if (new Date(session.expiresAt) <= new Date()) {
        return {
          isValid: false,
          riskLevel: 'medium',
          reasons: ['Session expired'],
          actionRequired: 'reauth'
        };
      }

      // Validate fingerprint
      const currentFingerprint = await this.generateSessionFingerprint();
      if (currentFingerprint !== session.sessionFingerprint) {
        return {
          isValid: false,
          riskLevel: 'high',
          reasons: ['Device fingerprint mismatch'],
          actionRequired: 'challenge'
        };
      }

      return {
        isValid: true,
        riskLevel: 'low',
        reasons: []
      };

    } catch (error) {
      console.error('Session validation failed:', error);
      return {
        isValid: false,
        riskLevel: 'high',
        reasons: ['Validation error'],
        actionRequired: 'block'
      };
    }
  }

  getSessionHealth(sessionId: string): SessionHealth {
    const session = this.sessionStorage.get(sessionId);
    if (!session) {
      return {
        isHealthy: false,
        riskLevel: 'high',
        lastValidated: null,
        issues: ['Session not found']
      };
    }

    const issues: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check expiration
    const timeUntilExpiry = new Date(session.expiresAt).getTime() - Date.now();
    if (timeUntilExpiry <= 0) {
      issues.push('Session expired');
      riskLevel = 'high';
    } else if (timeUntilExpiry < 60 * 60 * 1000) { // Less than 1 hour
      issues.push('Session expires soon');
      riskLevel = 'medium';
    }

    return {
      isHealthy: issues.length === 0,
      riskLevel,
      lastValidated: session.lastValidated,
      issues
    };
  }

  getCurrentSession(): SecureGP51Session | null {
    return this.currentSession;
  }

  async clearSession(sessionId: string): Promise<void> {
    try {
      // Remove from database
      await supabase
        .from('gp51_sessions')
        .delete()
        .eq('id', sessionId);

      // Remove from memory
      this.sessionStorage.delete(sessionId);
      
      if (this.currentSession?.id === sessionId) {
        this.currentSession = null;
      }

      console.log('Secure session cleared');
    } catch (error) {
      console.error('Failed to clear secure session:', error);
    }
  }
}

export const enhancedGP51SessionManager = EnhancedGP51SessionManager.getInstance();
