
import { supabase } from '@/integrations/supabase/client';
import { SessionValidator, SessionFingerprint, SecurityValidationResult } from './sessionValidator';
import { SessionEncryption } from './sessionEncryption';

export interface SecureGP51Session {
  id: string;
  token: string;
  username: string;
  expiresAt: Date;
  fingerprint: SessionFingerprint;
  encryptionKey: CryptoKey;
  lastValidated: Date;
  riskLevel: 'low' | 'medium' | 'high';
}

export class EnhancedGP51SessionManager {
  private static instance: EnhancedGP51SessionManager;
  private currentSession: SecureGP51Session | null = null;
  private validationInterval: NodeJS.Timeout | null = null;
  private sessionListeners: Set<(session: SecureGP51Session | null) => void> = new Set();
  
  private static readonly VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly SESSION_RENEWAL_THRESHOLD = 30 * 60 * 1000; // 30 minutes before expiry

  static getInstance(): EnhancedGP51SessionManager {
    if (!EnhancedGP51SessionManager.instance) {
      EnhancedGP51SessionManager.instance = new EnhancedGP51SessionManager();
    }
    return EnhancedGP51SessionManager.instance;
  }

  async createSecureSession(username: string, rawToken: string): Promise<SecureGP51Session> {
    try {
      console.log('🔐 Creating secure GP51 session...');

      const fingerprint = SessionValidator.generateFingerprint();
      const encryptionKey = await SessionEncryption.generateKey();
      const sessionId = await SessionEncryption.generateSecureSessionId();
      
      // Encrypt the token
      const encryptedToken = await SessionEncryption.encryptSessionToken(rawToken, encryptionKey);
      
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Store session in database with encryption
      const { data: storedSession, error } = await supabase
        .from('gp51_sessions')
        .insert({
          id: sessionId,
          envio_user_id: user.id,
          username,
          gp51_token: encryptedToken,
          token_expires_at: expiresAt.toISOString(),
          session_fingerprint: fingerprint,
          is_encrypted: true,
          risk_level: 'low',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const secureSession: SecureGP51Session = {
        id: sessionId,
        token: rawToken,
        username,
        expiresAt,
        fingerprint,
        encryptionKey,
        lastValidated: new Date(),
        riskLevel: 'low'
      };

      this.currentSession = secureSession;
      this.startSessionValidation();
      this.notifyListeners(secureSession);

      // Log session creation
      await SessionValidator.logSecurityEvent(
        user.id,
        'secure_session_created',
        { sessionId, username },
        fingerprint
      );

      console.log('✅ Secure GP51 session created successfully');
      return secureSession;

    } catch (error) {
      console.error('❌ Failed to create secure session:', error);
      throw error;
    }
  }

  async validateCurrentSession(): Promise<SecurityValidationResult> {
    if (!this.currentSession) {
      return {
        isValid: false,
        riskLevel: 'high',
        reasons: ['No active session'],
        actionRequired: 'reauth'
      };
    }

    const currentFingerprint = SessionValidator.generateFingerprint();
    const validation = await SessionValidator.validateSession(
      this.currentSession.id,
      currentFingerprint
    );

    // Update session risk level
    this.currentSession.riskLevel = validation.riskLevel;
    this.currentSession.lastValidated = new Date();

    // Handle security actions
    if (validation.actionRequired) {
      await this.handleSecurityAction(validation.actionRequired, validation.reasons);
    }

    // Check if session needs renewal
    const timeUntilExpiry = this.currentSession.expiresAt.getTime() - Date.now();
    if (timeUntilExpiry < EnhancedGP51SessionManager.SESSION_RENEWAL_THRESHOLD) {
      await this.renewSession();
    }

    return validation;
  }

  private async handleSecurityAction(action: 'challenge' | 'reauth' | 'block', reasons: string[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await SessionValidator.logSecurityEvent(
      user.id,
      'security_action_triggered',
      { action, reasons, sessionId: this.currentSession?.id },
      SessionValidator.generateFingerprint()
    );

    switch (action) {
      case 'block':
        await this.terminateSession();
        break;
      case 'reauth':
        await this.invalidateSession();
        break;
      case 'challenge':
        // Implement challenge mechanism (could be additional verification)
        console.warn('🔒 Security challenge required:', reasons);
        break;
    }
  }

  private async renewSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      console.log('🔄 Renewing GP51 session...');

      // Request new token from GP51
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'refresh_session' }
      });

      if (error || !data?.success) {
        throw new Error('Failed to refresh GP51 token');
      }

      // Create new secure session with refreshed token
      const newSession = await this.createSecureSession(
        this.currentSession.username,
        data.token
      );

      // Invalidate old session
      await supabase
        .from('gp51_sessions')
        .update({ 
          token_expires_at: new Date().toISOString(),
          is_active: false 
        })
        .eq('id', this.currentSession.id);

      console.log('✅ GP51 session renewed successfully');

    } catch (error) {
      console.error('❌ Failed to renew session:', error);
      await this.invalidateSession();
    }
  }

  private startSessionValidation(): void {
    this.stopSessionValidation();
    
    this.validationInterval = setInterval(async () => {
      const validation = await this.validateCurrentSession();
      if (!validation.isValid) {
        console.warn('🚨 Session validation failed:', validation.reasons);
      }
    }, EnhancedGP51SessionManager.VALIDATION_INTERVAL);
  }

  private stopSessionValidation(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  async terminateSession(): Promise<void> {
    if (!this.currentSession) return;

    console.log('🔒 Terminating secure session...');

    // Invalidate session in database
    await supabase
      .from('gp51_sessions')
      .update({ 
        token_expires_at: new Date().toISOString(),
        is_active: false 
      })
      .eq('id', this.currentSession.id);

    this.currentSession = null;
    this.stopSessionValidation();
    this.notifyListeners(null);
  }

  async invalidateSession(): Promise<void> {
    await this.terminateSession();
    // Could trigger re-authentication flow here
  }

  getCurrentSession(): SecureGP51Session | null {
    return this.currentSession;
  }

  subscribe(callback: (session: SecureGP51Session | null) => void): () => void {
    this.sessionListeners.add(callback);
    return () => this.sessionListeners.delete(callback);
  }

  private notifyListeners(session: SecureGP51Session | null): void {
    this.sessionListeners.forEach(callback => {
      try {
        callback(session);
      } catch (error) {
        console.error('Error notifying session listener:', error);
      }
    });
  }

  async getSessionHealth(): Promise<{
    isHealthy: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    lastValidated: Date | null;
    issues: string[];
  }> {
    if (!this.currentSession) {
      return {
        isHealthy: false,
        riskLevel: 'high',
        lastValidated: null,
        issues: ['No active session']
      };
    }

    const validation = await this.validateCurrentSession();
    
    return {
      isHealthy: validation.isValid,
      riskLevel: validation.riskLevel,
      lastValidated: this.currentSession.lastValidated,
      issues: validation.reasons
    };
  }
}

export const enhancedGP51SessionManager = EnhancedGP51SessionManager.getInstance();
