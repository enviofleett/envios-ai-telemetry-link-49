
import { supabase } from '@/integrations/supabase/client';

export interface AdminAuditLog {
  actionType: 'workshop_approval' | 'workshop_rejection' | 'workshop_suspension' | 'user_role_change' | 'system_config_change' | 'bulk_import' | 'data_export' | 'security_config';
  targetEntityType: string;
  targetEntityId?: string;
  actionDetails?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityAuditLog {
  actionType: 'login' | 'logout' | 'failed_login' | 'password_change' | 'role_change' | 'admin_action' | 'data_access' | 'data_modification' | 'system_access' | 'api_access';
  resourceType?: string;
  resourceId?: string;
  requestDetails?: Record<string, any>;
  responseStatus?: number;
  errorMessage?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  success?: boolean;
}

export class AuditLogger {
  static async logAdminAction(log: AdminAuditLog): Promise<void> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      if (!user) {
        console.warn('Cannot log admin action: No authenticated user');
        return;
      }

      const sessionFingerprint = this.generateSessionFingerprint();

      await supabase.rpc('log_admin_action', {
        p_admin_user_id: user.id,
        p_action_type: log.actionType,
        p_target_entity_type: log.targetEntityType,
        p_target_entity_id: log.targetEntityId || null,
        p_action_details: log.actionDetails || {},
        p_ip_address: log.ipAddress || null,
        p_user_agent: log.userAgent || navigator.userAgent,
        p_session_fingerprint: sessionFingerprint
      });

      console.log(`🔍 Admin action logged: ${log.actionType} on ${log.targetEntityType}`, log.actionDetails);
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  static async logSecurityEvent(log: SecurityAuditLog): Promise<void> {
    try {
      const user = (await supabase.auth.getUser()).data.user;

      await supabase.rpc('log_security_event', {
        p_user_id: user?.id || null,
        p_action_type: log.actionType,
        p_resource_type: log.resourceType || null,
        p_resource_id: log.resourceId || null,
        p_ip_address: null, // Would need server-side implementation
        p_user_agent: navigator.userAgent,
        p_session_id: null, // Would need session management
        p_request_details: log.requestDetails || {},
        p_response_status: log.responseStatus || null,
        p_error_message: log.errorMessage || null,
        p_risk_level: log.riskLevel || 'low',
        p_success: log.success !== false
      });

      console.log(`🔒 Security event logged: ${log.actionType}`, log.requestDetails);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  static async getAdminAuditLogs(filters?: {
    adminUserId?: string;
    actionType?: string;
    targetEntityType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('admin_action_logs')
        .select(`
          *,
          admin_user:admin_user_id(email, name)
        `)
        .order('performed_at', { ascending: false });

      if (filters?.adminUserId) {
        query = query.eq('admin_user_id', filters.adminUserId);
      }

      if (filters?.actionType) {
        query = query.eq('action_type', filters.actionType);
      }

      if (filters?.targetEntityType) {
        query = query.eq('target_entity_type', filters.targetEntityType);
      }

      if (filters?.startDate) {
        query = query.gte('performed_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('performed_at', filters.endDate.toISOString());
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch admin audit logs:', error);
      throw error;
    }
  }

  static async getSecurityAuditLogs(filters?: {
    userId?: string;
    actionType?: string;
    riskLevel?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('security_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.actionType) {
        query = query.eq('action_type', filters.actionType);
      }

      if (filters?.riskLevel) {
        query = query.eq('risk_level', filters.riskLevel);
      }

      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch security audit logs:', error);
      throw error;
    }
  }

  private static generateSessionFingerprint(): string {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`
    };

    return btoa(JSON.stringify(fingerprint)).slice(0, 32);
  }
}
