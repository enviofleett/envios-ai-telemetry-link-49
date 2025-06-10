
import { supabase } from '@/integrations/supabase/client';

export interface SessionFingerprint {
  userAgent: string;
  ipAddress?: string;
  timezone: string;
  language: string;
  screen: string;
  deviceId: string;
}

export interface SecurityValidationResult {
  isValid: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  actionRequired?: 'challenge' | 'reauth' | 'block';
}

export class SessionValidator {
  private static readonly MAX_CONCURRENT_SESSIONS = 3;
  private static readonly SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
  private static readonly SUSPICIOUS_ACTIVITY_THRESHOLD = 5;

  static generateFingerprint(): SessionFingerprint {
    const userAgent = navigator.userAgent;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const screen = `${window.screen.width}x${window.screen.height}`;
    
    // Generate a device ID based on various browser characteristics
    const deviceId = this.generateDeviceId(userAgent, timezone, language, screen);

    return {
      userAgent,
      timezone,
      language,
      screen,
      deviceId
    };
  }

  private static generateDeviceId(userAgent: string, timezone: string, language: string, screen: string): string {
    const combined = `${userAgent}-${timezone}-${language}-${screen}`;
    return btoa(combined).slice(0, 16);
  }

  static async validateSession(sessionId: string, currentFingerprint: SessionFingerprint): Promise<SecurityValidationResult> {
    try {
      console.log('🔒 Validating session security...');

      // Get session from database
      const { data: session, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        return {
          isValid: false,
          riskLevel: 'high',
          reasons: ['Session not found'],
          actionRequired: 'reauth'
        };
      }

      const reasons: string[] = [];
      let riskLevel: 'low' | 'medium' | 'high' = 'low';

      // Check session expiry
      const sessionAge = Date.now() - new Date(session.created_at).getTime();
      if (sessionAge > this.SESSION_TIMEOUT) {
        reasons.push('Session expired');
        riskLevel = 'medium';
      }

      // Check fingerprint match
      const storedFingerprint = session.session_fingerprint as SessionFingerprint;
      if (storedFingerprint) {
        if (storedFingerprint.deviceId !== currentFingerprint.deviceId) {
          reasons.push('Device fingerprint mismatch');
          riskLevel = 'high';
        }
        
        if (storedFingerprint.userAgent !== currentFingerprint.userAgent) {
          reasons.push('User agent changed');
          riskLevel = 'medium';
        }

        if (storedFingerprint.timezone !== currentFingerprint.timezone) {
          reasons.push('Timezone changed');
          riskLevel = 'medium';
        }
      }

      // Check for concurrent sessions
      const { data: concurrentSessions } = await supabase
        .from('gp51_sessions')
        .select('id')
        .eq('envio_user_id', session.envio_user_id)
        .gt('token_expires_at', new Date().toISOString());

      if (concurrentSessions && concurrentSessions.length > this.MAX_CONCURRENT_SESSIONS) {
        reasons.push('Too many concurrent sessions');
        riskLevel = 'high';
      }

      // Check for suspicious activity
      const { data: auditLogs } = await supabase
        .from('security_audit_logs')
        .select('*')
        .eq('user_id', session.envio_user_id)
        .eq('event_type', 'session_anomaly')
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (auditLogs && auditLogs.length > this.SUSPICIOUS_ACTIVITY_THRESHOLD) {
        reasons.push('Suspicious activity detected');
        riskLevel = 'high';
      }

      const isValid = reasons.length === 0 || (riskLevel === 'low' && reasons.length <= 1);

      let actionRequired: 'challenge' | 'reauth' | 'block' | undefined;
      if (riskLevel === 'high') {
        actionRequired = reasons.includes('Too many concurrent sessions') ? 'block' : 'reauth';
      } else if (riskLevel === 'medium') {
        actionRequired = 'challenge';
      }

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

  static async logSecurityEvent(userId: string, eventType: string, details: any, fingerprint: SessionFingerprint) {
    try {
      await supabase.from('security_audit_logs').insert({
        user_id: userId,
        event_type: eventType,
        event_details: details,
        session_fingerprint: fingerprint,
        ip_address: details.ipAddress,
        user_agent: fingerprint.userAgent,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}
