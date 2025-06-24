
import { supabase } from '@/integrations/supabase/client';

export interface SecureGP51Session {
  id: string;
  username: string;
  token: string;
  expiresAt: Date;
  lastValidated: Date;
  riskLevel: 'low' | 'medium' | 'high';
  fingerprint: string;
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

export class EnhancedGP51SessionManager {
  private static instance: EnhancedGP51SessionManager;
  private currentSession: SecureGP51Session | null = null;
  private subscribers: ((session: SecureGP51Session | null) => void)[] = [];

  private constructor() {}

  static getInstance(): EnhancedGP51SessionManager {
    if (!EnhancedGP51SessionManager.instance) {
      EnhancedGP51SessionManager.instance = new EnhancedGP51SessionManager();
    }
    return EnhancedGP51SessionManager.instance;
  }

  async createSecureSession(username: string, token: string): Promise<{
    success: boolean;
    session?: SecureGP51Session;
    error?: string;
  }> {
    try {
      console.log('🔐 Creating secure GP51 session...');

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8); // 8 hours from now

      const session: SecureGP51Session = {
        id: crypto.randomUUID(),
        username,
        token,
        expiresAt,
        lastValidated: new Date(),
        riskLevel: 'low',
        fingerprint: this.generateFingerprint()
      };

      // Store session in database
      const { error } = await supabase
        .from('gp51_sessions')
        .upsert({
          envio_user_id: (await supabase.auth.getUser()).data.user?.id,
          username,
          gp51_token: token,
          token_expires_at: expiresAt.toISOString(),
          password_hash: '', // Will be set by auth service
          last_validated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Failed to store session:', error);
        return {
          success: false,
          error: `Failed to store session: ${error.message}`
        };
      }

      this.currentSession = session;
      this.notifySubscribers(session);

      console.log('✅ Secure session created successfully');
      return {
        success: true,
        session
      };

    } catch (error) {
      console.error('❌ Failed to create secure session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session creation failed'
      };
    }
  }

  async validateCurrentSession(): Promise<SessionValidationResult> {
    if (!this.currentSession) {
      return {
        isValid: false,
        riskLevel: 'high',
        reasons: ['No active session'],
        actionRequired: 'reauth'
      };
    }

    const reasons: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check if session has expired
    if (new Date() > this.currentSession.expiresAt) {
      reasons.push('Session expired');
      riskLevel = 'high';
    }

    // Check if session needs refresh (within 1 hour of expiry)
    const timeUntilExpiry = this.currentSession.expiresAt.getTime() - Date.now();
    if (timeUntilExpiry < 60 * 60 * 1000) { // 1 hour
      reasons.push('Session expires soon');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Check last validation time (should be within 30 minutes)
    const timeSinceValidation = Date.now() - this.currentSession.lastValidated.getTime();
    if (timeSinceValidation > 30 * 60 * 1000) { // 30 minutes
      reasons.push('Session validation overdue');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    const isValid = reasons.length === 0 || (riskLevel !== 'high' && reasons.length <= 1);

    let actionRequired: 'challenge' | 'reauth' | 'block' | undefined;
    if (riskLevel === 'high') {
      actionRequired = 'reauth';
    } else if (riskLevel === 'medium') {
      actionRequired = 'challenge';
    }

    return {
      isValid,
      riskLevel,
      reasons,
      actionRequired
    };
  }

  getCurrentSession(): SecureGP51Session | null {
    return this.currentSession;
  }

  getSessionHealth(): SessionHealth {
    if (!this.currentSession) {
      return {
        isHealthy: false,
        riskLevel: 'high',
        lastValidated: null,
        issues: ['No active session']
      };
    }

    const validation = this.validateCurrentSession();
    
    return {
      isHealthy: validation.then ? false : validation.isValid, // Handle async case
      riskLevel: this.currentSession.riskLevel,
      lastValidated: this.currentSession.lastValidated,
      issues: validation.then ? ['Validation in progress'] : validation.reasons
    };
  }

  async invalidateSession(): Promise<void> {
    try {
      console.log('🔓 Invalidating session...');
      
      if (this.currentSession) {
        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('gp51_sessions')
            .delete()
            .eq('envio_user_id', user.id);
        }
      }

      this.currentSession = null;
      this.notifySubscribers(null);
      
      console.log('✅ Session invalidated');
    } catch (error) {
      console.error('❌ Failed to invalidate session:', error);
      throw error;
    }
  }

  async terminateSession(): Promise<void> {
    await this.invalidateSession();
  }

  subscribe(callback: (session: SecureGP51Session | null) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(session: SecureGP51Session | null): void {
    this.subscribers.forEach(callback => callback(session));
  }

  private generateFingerprint(): string {
    const userAgent = navigator.userAgent;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const screen = `${window.screen.width}x${window.screen.height}`;
    
    const combined = `${userAgent}-${timezone}-${language}-${screen}`;
    return btoa(combined).slice(0, 16);
  }
}

export const enhancedGP51SessionManager = EnhancedGP51SessionManager.getInstance();
