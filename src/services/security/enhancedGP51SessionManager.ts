import { supabase } from '@/integrations/supabase/client';
import { SessionEncryption } from './sessionEncryption';

export interface SecureGP51Session {
  sessionId: string;
  username: string;
  encryptedToken: string;
  expiresAt: string;
  createdAt: string;
  lastValidated: string;
  riskLevel: 'low' | 'medium' | 'high';
  securityFlags: string[];
}

export interface SessionValidationResult {
  isValid: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  actionRequired?: 'none' | 'refresh' | 'reauth';
}

export interface SecureSessionCreationResult {
  success: boolean;
  session?: SecureGP51Session;
  error?: string;
}

export class EnhancedGP51SessionManager {
  private static instance: EnhancedGP51SessionManager;
  private currentSession: SecureGP51Session | null = null;
  private encryptionKey: CryptoKey | null = null;
  private sessionListeners: ((session: SecureGP51Session | null) => void)[] = [];
  private validationTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeEncryption();
    this.startPeriodicValidation();
  }

  static getInstance(): EnhancedGP51SessionManager {
    if (!EnhancedGP51SessionManager.instance) {
      EnhancedGP51SessionManager.instance = new EnhancedGP51SessionManager();
    }
    return EnhancedGP51SessionManager.instance;
  }

  private async initializeEncryption(): Promise<void> {
    try {
      this.encryptionKey = await SessionEncryption.generateKey();
      console.log('🔐 Session encryption initialized');
    } catch (error) {
      console.error('❌ Failed to initialize session encryption:', error);
    }
  }

  async createSecureSession(username: string, token: string): Promise<SecureSessionCreationResult> {
    try {
      if (!this.encryptionKey) {
        await this.initializeEncryption();
      }

      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }

      console.log('🔒 Creating secure GP51 session...');

      const sessionId = await SessionEncryption.generateSecureSessionId();
      const encryptedToken = await SessionEncryption.encryptSessionToken(token, this.encryptionKey);
      const now = new Date().toISOString();
      
      // Calculate initial risk level
      const riskAssessment = await this.assessInitialRisk(username, sessionId);

      const secureSession: SecureGP51Session = {
        sessionId,
        username,
        encryptedToken,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
        createdAt: now,
        lastValidated: now,
        riskLevel: riskAssessment.riskLevel,
        securityFlags: riskAssessment.flags
      };

      // Store session securely
      await this.storeSecureSession(secureSession);
      
      this.currentSession = secureSession;
      this.notifyListeners();

      // Log security event
      await this.logSecurityEvent('SESSION_CREATED', {
        sessionId,
        username,
        riskLevel: secureSession.riskLevel,
        securityFlags: secureSession.securityFlags
      });

      console.log('✅ Secure session created successfully');

      return {
        success: true,
        session: secureSession
      };

    } catch (error) {
      console.error('❌ Failed to create secure session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create secure session'
      };
    }
  }

  private async assessInitialRisk(username: string, sessionId: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    flags: string[];
  }> {
    const flags: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    try {
      // Check for concurrent sessions
      const { data: activeSessions } = await supabase
        .from('gp51_sessions')
        .select('id')
        .eq('username', username)
        .eq('is_active', true);

      if (activeSessions && activeSessions.length > 2) {
        flags.push('MULTIPLE_ACTIVE_SESSIONS');
        riskLevel = 'medium';
      }

      // Check recent failed attempts (would need additional table)
      // For now, we'll keep it simple
      
      // Check for admin accounts
      if (username === 'octopus' || username.toLowerCase().includes('admin')) {
        flags.push('ADMIN_ACCOUNT');
        riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      }

    } catch (error) {
      console.warn('⚠️ Risk assessment failed:', error);
      flags.push('RISK_ASSESSMENT_FAILED');
      riskLevel = 'medium';
    }

    return { riskLevel, flags };
  }

  private async storeSecureSession(session: SecureGP51Session): Promise<void> {
    try {
      // Store session metadata (not the encrypted token) in database
      await supabase.from('gp51_sessions').upsert({
        id: session.sessionId,
        username: session.username,
        gp51_token: '[ENCRYPTED]', // Don't store actual token
        token_expires_at: session.expiresAt,
        is_active: true,
        created_at: session.createdAt,
        updated_at: new Date().toISOString(),
        last_activity_at: session.lastValidated
      });

      // Store encrypted token separately in secure storage if available
      // For now, keep it in memory only for maximum security
      
    } catch (error) {
      console.error('❌ Failed to store secure session:', error);
      throw error;
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

    try {
      const reasons: string[] = [];
      let riskLevel: 'low' | 'medium' | 'high' = this.currentSession.riskLevel;

      // Check expiration
      const now = new Date();
      const expiresAt = new Date(this.currentSession.expiresAt);
      
      if (expiresAt <= now) {
        reasons.push('Session expired');
        riskLevel = 'high';
      }

      // Check if session has been inactive too long
      const lastValidated = new Date(this.currentSession.lastValidated);
      const inactiveTime = now.getTime() - lastValidated.getTime();
      const maxInactiveTime = 2 * 60 * 60 * 1000; // 2 hours

      if (inactiveTime > maxInactiveTime) {
        reasons.push('Session inactive too long');
        riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      }

      // Check for security flags
      if (this.currentSession.securityFlags.length > 0) {
        reasons.push(`Security flags: ${this.currentSession.securityFlags.join(', ')}`);
        riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      }

      // Test actual token validity with GP51
      const tokenValid = await this.validateTokenWithGP51();
      if (!tokenValid) {
        reasons.push('Token invalid with GP51');
        riskLevel = 'high';
      }

      const isValid = reasons.length === 0 || riskLevel !== 'high';
      let actionRequired: 'none' | 'refresh' | 'reauth' = 'none';

      if (riskLevel === 'high') {
        actionRequired = 'reauth';
      } else if (riskLevel === 'medium') {
        actionRequired = 'refresh';
      }

      // Update validation timestamp
      this.currentSession.lastValidated = now.toISOString();

      return {
        isValid,
        riskLevel,
        reasons,
        actionRequired
      };

    } catch (error) {
      console.error('❌ Session validation failed:', error);
      return {
        isValid: false,
        riskLevel: 'high',
        reasons: ['Validation error'],
        actionRequired: 'reauth'
      };
    }
  }

  private async validateTokenWithGP51(): Promise<boolean> {
    try {
      if (!this.currentSession || !this.encryptionKey) {
        return false;
      }

      const decryptedToken = await SessionEncryption.decryptSessionToken(
        this.currentSession.encryptedToken,
        this.encryptionKey
      );

      // Test token with a lightweight GP51 operation
      const { data, error } = await supabase.functions.invoke('gp51-service', {
        body: {
          action: 'test_token',
          token: decryptedToken
        }
      });

      return !error && data?.success;

    } catch (error) {
      console.error('❌ Token validation with GP51 failed:', error);
      return false;
    }
  }

  private startPeriodicValidation(): void {
    // Validate session every 5 minutes
    this.validationTimer = setInterval(async () => {
      if (this.currentSession) {
        const validation = await this.validateCurrentSession();
        
        if (!validation.isValid) {
          console.warn('⚠️ Session validation failed during periodic check:', validation.reasons);
          
          if (validation.actionRequired === 'reauth') {
            await this.terminateSession();
          }
        }
      }
    }, 5 * 60 * 1000);
  }

  async terminateSession(): Promise<void> {
    if (this.currentSession) {
      // Log termination
      await this.logSecurityEvent('SESSION_TERMINATED', {
        sessionId: this.currentSession.sessionId,
        username: this.currentSession.username,
        reason: 'Manual termination'
      });

      // Mark as inactive in database
      try {
        await supabase
          .from('gp51_sessions')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.currentSession.sessionId);
      } catch (error) {
        console.warn('⚠️ Failed to update session status in database:', error);
      }

      this.currentSession = null;
      this.notifyListeners();
    }
  }

  getCurrentSession(): SecureGP51Session | null {
    return this.currentSession;
  }

  subscribe(callback: (session: SecureGP51Session | null) => void): () => void {
    this.sessionListeners.push(callback);
    
    // Immediately call with current session
    callback(this.currentSession);
    
    return () => {
      this.sessionListeners = this.sessionListeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    this.sessionListeners.forEach(listener => {
      try {
        listener(this.currentSession);
      } catch (error) {
        console.error('Error in session listener:', error);
      }
    });
  }

  private async logSecurityEvent(eventType: string, details: any): Promise<void> {
    try {
      // For now, log to console. In production, this would go to a security audit log
      console.log(`🔐 [SECURITY] ${eventType}:`, details);
      
      // TODO: When security_audit_logs table is available, uncomment this:
      // await supabase.from('security_audit_logs').insert({
      //   event_type: eventType,
      //   event_details: details,
      //   created_at: new Date().toISOString()
      // });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  destroy(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
    }
    this.terminateSession();
  }
}

// Export singleton instance
export const enhancedGP51SessionManager = EnhancedGP51SessionManager.getInstance();
