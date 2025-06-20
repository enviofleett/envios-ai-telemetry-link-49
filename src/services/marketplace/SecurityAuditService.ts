
import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  type: 'payment_attempt' | 'failed_payment' | 'suspicious_activity' | 'fraud_detection' | 'account_access' | 'data_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  additional_data?: any;
}

export interface AuditLog {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  additional_data?: any;
  created_at: string;
}

class SecurityAuditService {
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('marketplace_security_logs')
        .insert({
          event_type: event.type,
          severity: event.severity,
          description: event.description,
          user_id: event.user_id,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          additional_data: event.additional_data || {},
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log security event:', error);
      }

      // Alert on high/critical severity events
      if (event.severity === 'high' || event.severity === 'critical') {
        await this.triggerSecurityAlert(event);
      }
    } catch (error) {
      console.error('Security audit service error:', error);
    }
  }

  async getSecurityLogs(filters?: {
    userId?: string;
    eventType?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    let query = supabase
      .from('marketplace_security_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AuditLog[];
  }

  async detectFraudulentActivity(userId: string, activityData: any): Promise<boolean> {
    // Check for rapid repeated payment attempts
    const recentAttempts = await this.getSecurityLogs({
      userId,
      eventType: 'payment_attempt',
      startDate: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // Last 5 minutes
      limit: 10
    });

    if (recentAttempts.length > 5) {
      await this.logSecurityEvent({
        type: 'fraud_detection',
        severity: 'high',
        description: 'Multiple rapid payment attempts detected',
        user_id: userId,
        additional_data: { attemptCount: recentAttempts.length, ...activityData }
      });
      return true;
    }

    // Check for unusual payment amounts
    if (activityData.amount && activityData.amount > 1000000) { // 1M NGN
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        description: 'Unusually high payment amount',
        user_id: userId,
        additional_data: activityData
      });
    }

    return false;
  }

  private async triggerSecurityAlert(event: SecurityEvent): Promise<void> {
    // Log critical security events for admin attention
    const { error } = await supabase
      .from('marketplace_security_alerts')
      .insert({
        event_type: event.type,
        severity: event.severity,
        description: event.description,
        user_id: event.user_id,
        alert_data: event.additional_data || {},
        status: 'new',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to create security alert:', error);
    }
  }
}

export const securityAuditService = new SecurityAuditService();
