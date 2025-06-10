
import { supabase } from '@/integrations/supabase/client';
import { SecurityService } from './SecurityService';

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
  private sessionSubscribers: Set<(session: SecureGP51Session | null) => void> = new Set();
  private validationInterval: NodeJS.Timeout | null = null;

  static getInstance(): EnhancedGP51SessionManager {
    if (!EnhancedGP51SessionManager.instance) {
      EnhancedGP51SessionManager.instance = new EnhancedGP51SessionManager();
    }
    return EnhancedGP51SessionManager.instance;
  }

  private generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 10, 10);
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
      canvas: canvas.toDataURL(),
      webgl: this.getWebGLInfo()
    };

    return btoa(JSON.stringify(fingerprint)).slice(0, 32);
  }

  private getWebGLInfo(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      if (!gl) return 'no-webgl';
      
      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      return `${vendor}-${renderer}`;
    } catch {
      return 'webgl-error';
    }
  }

  async createSecureSession(username: string, token: string): Promise<SecureGP51Session> {
    const sessionFingerprint = this.generateDeviceFingerprint();
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Validate inputs
    const usernameValidation = SecurityService.validateInput(username, 'username');
    const tokenValidation = SecurityService.validateInput(token, 'gp51_token');

    if (!usernameValidation.isValid) {
      throw new Error(`Invalid username: ${usernameValidation.error}`);
    }

    if (!tokenValidation.isValid) {
      throw new Error(`Invalid token: ${tokenValidation.error}`);
    }

    try {
      // Create secure session in database
      const { data: sessionData, error } = await supabase
        .from('secure_sessions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          session_token: token,
          session_fingerprint: sessionFingerprint,
          device_info: deviceInfo,
          expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
        })
        .select()
        .single();

      if (error) throw error;

      // Also create GP51 session record
      const { error: gp51Error } = await supabase
        .from('gp51_sessions')
        .upsert({
          username,
          gp51_token: token,
          token_expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          envio_user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (gp51Error) console.warn('Failed to create GP51 session record:', gp51Error);

      const secureSession: SecureGP51Session = {
        id: sessionData.id,
        username,
        token,
        expiresAt: sessionData.expires_at,
        sessionFingerprint,
        riskLevel: 'low',
        lastValidated: new Date(),
        deviceInfo
      };

      this.currentSession = secureSession;
      this.notifySubscribers();
      this.startSessionValidation();

      // Log security event
      await this.logSecurityEvent('login', 'Session created successfully', { 
        username, 
        sessionId: sessionData.id,
        deviceFingerprint: sessionFingerprint 
      });

      return secureSession;
    } catch (error) {
      await this.logSecurityEvent('failed_login', 'Failed to create secure session', { 
        username, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
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

    const reasons: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(this.currentSession.expiresAt);
    if (now >= expiresAt) {
      reasons.push('Session expired');
      riskLevel = 'high';
    }

    // Check device fingerprint
    const currentFingerprint = this.generateDeviceFingerprint();
    if (currentFingerprint !== this.currentSession.sessionFingerprint) {
      reasons.push('Device fingerprint mismatch');
      riskLevel = 'high';
    }

    // Validate session in database
    try {
      const { data: sessionData, error } = await supabase
        .from('secure_sessions')
        .select('*')
        .eq('id', this.currentSession.id)
        .eq('is_active', true)
        .single();

      if (error || !sessionData) {
        reasons.push('Session not found in database');
        riskLevel = 'high';
      } else {
        // Update last activity
        await supabase
          .from('secure_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', this.currentSession.id);
      }
    } catch (error) {
      reasons.push('Database validation failed');
      riskLevel = 'medium';
    }

    const isValid = reasons.length === 0;

    if (!isValid) {
      await this.logSecurityEvent('system_access', 'Session validation failed', { 
        sessionId: this.currentSession.id,
        reasons,
        riskLevel 
      });
    }

    let actionRequired: 'challenge' | 'reauth' | 'block' | undefined;
    if (riskLevel === 'high') {
      actionRequired = reasons.includes('Device fingerprint mismatch') ? 'block' : 'reauth';
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

  async getSessionHealth(): Promise<SessionHealth> {
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

  async invalidateSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Revoke session in database
      await supabase
        .from('secure_sessions')
        .update({ 
          is_active: false, 
          revoked_at: new Date().toISOString(),
          revoked_reason: 'Manual invalidation'
        })
        .eq('id', this.currentSession.id);

      await this.logSecurityEvent('logout', 'Session manually invalidated', { 
        sessionId: this.currentSession.id 
      });

      this.currentSession = null;
      this.stopSessionValidation();
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to invalidate session:', error);
    }
  }

  async terminateSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Revoke session in database
      await supabase
        .from('secure_sessions')
        .update({ 
          is_active: false, 
          revoked_at: new Date().toISOString(),
          revoked_reason: 'User logout'
        })
        .eq('id', this.currentSession.id);

      await this.logSecurityEvent('logout', 'Session terminated', { 
        sessionId: this.currentSession.id 
      });

      this.currentSession = null;
      this.stopSessionValidation();
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  }

  getCurrentSession(): SecureGP51Session | null {
    return this.currentSession;
  }

  subscribe(callback: (session: SecureGP51Session | null) => void): () => void {
    this.sessionSubscribers.add(callback);
    return () => {
      this.sessionSubscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.sessionSubscribers.forEach(callback => {
      try {
        callback(this.currentSession);
      } catch (error) {
        console.error('Session subscriber error:', error);
      }
    });
  }

  private startSessionValidation(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
    }

    this.validationInterval = setInterval(async () => {
      const validation = await this.validateCurrentSession();
      
      if (!validation.isValid && validation.actionRequired) {
        await this.handleSecurityAction(validation.actionRequired, validation.reasons);
      }
    }, 60000); // Validate every minute
  }

  private stopSessionValidation(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  private async handleSecurityAction(action: 'challenge' | 'reauth' | 'block', reasons: string[]): Promise<void> {
    await this.logSecurityEvent('system_access', `Security action required: ${action}`, { 
      action,
      reasons,
      sessionId: this.currentSession?.id 
    });

    switch (action) {
      case 'reauth':
      case 'block':
        await this.terminateSession();
        // In a real app, redirect to login
        window.location.href = '/auth';
        break;
      case 'challenge':
        // In a real app, show security challenge
        console.warn('Security challenge required:', reasons);
        break;
    }
  }

  private async logSecurityEvent(type: string, description: string, additionalData?: any): Promise<void> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      await supabase.rpc('log_security_event', {
        p_user_id: user?.id || null,
        p_action_type: type,
        p_resource_type: 'gp51_session',
        p_resource_id: this.currentSession?.id || null,
        p_request_details: additionalData || {},
        p_risk_level: 'medium'
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

export const enhancedGP51SessionManager = EnhancedGP51SessionManager.getInstance();
