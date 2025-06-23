
import { supabase } from '@/integrations/supabase/client';

export interface SystemAlert {
  id: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  sourceSystem: string;
  sourceEntityId?: string;
  alertData: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  notificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SystemAlertManager {
  private static instance: SystemAlertManager;

  static getInstance(): SystemAlertManager {
    if (!SystemAlertManager.instance) {
      SystemAlertManager.instance = new SystemAlertManager();
    }
    return SystemAlertManager.instance;
  }

  async getActiveAlerts(severity?: 'info' | 'warning' | 'critical'): Promise<SystemAlert[]> {
    console.log('🚨 [ALERT-MANAGER] Fetching active alerts');

    let query = supabase
      .from('system_alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [ALERT-MANAGER] Failed to fetch alerts:', error);
      throw error;
    }

    return data?.map(this.mapAlertFromDb) || [];
  }

  async acknowledgeAlert(alertId: string, userId: string, notes?: string): Promise<void> {
    console.log('✅ [ALERT-MANAGER] Acknowledging alert:', alertId);

    const { error } = await supabase
      .from('system_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
        resolution_notes: notes
      })
      .eq('id', alertId);

    if (error) {
      console.error('❌ [ALERT-MANAGER] Failed to acknowledge alert:', error);
      throw error;
    }
  }

  async resolveAlert(alertId: string, userId: string, resolutionNotes: string): Promise<void> {
    console.log('✅ [ALERT-MANAGER] Resolving alert:', alertId);

    const { error } = await supabase
      .from('system_alerts')
      .update({
        status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes
      })
      .eq('id', alertId);

    if (error) {
      console.error('❌ [ALERT-MANAGER] Failed to resolve alert:', error);
      throw error;
    }
  }

  async dismissAlert(alertId: string, userId: string): Promise<void> {
    console.log('🗑️ [ALERT-MANAGER] Dismissing alert:', alertId);

    const { error } = await supabase
      .from('system_alerts')
      .update({
        status: 'dismissed',
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      console.error('❌ [ALERT-MANAGER] Failed to dismiss alert:', error);
      throw error;
    }
  }

  async getAlertsSummary(): Promise<{
    total: number;
    critical: number;
    warning: number;
    info: number;
    bySource: Record<string, number>;
  }> {
    console.log('📊 [ALERT-MANAGER] Getting alerts summary');

    const { data, error } = await supabase
      .from('system_alerts')
      .select('severity, source_system')
      .eq('status', 'active');

    if (error) {
      console.error('❌ [ALERT-MANAGER] Failed to get summary:', error);
      throw error;
    }

    const summary = {
      total: data?.length || 0,
      critical: 0,
      warning: 0,
      info: 0,
      bySource: {} as Record<string, number>
    };

    data?.forEach(alert => {
      if (alert.severity === 'critical') summary.critical++;
      else if (alert.severity === 'warning') summary.warning++;
      else if (alert.severity === 'info') summary.info++;

      summary.bySource[alert.source_system] = (summary.bySource[alert.source_system] || 0) + 1;
    });

    return summary;
  }

  async scheduleNotifications(): Promise<void> {
    console.log('📧 [ALERT-MANAGER] Scheduling notifications for unsent alerts');

    // Get all critical and warning alerts that haven't been sent
    const { data: unsentAlerts, error } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('notification_sent', false)
      .in('severity', ['critical', 'warning'])
      .eq('status', 'active');

    if (error) {
      console.error('❌ [ALERT-MANAGER] Failed to fetch unsent alerts:', error);
      return;
    }

    // Schedule email notifications for each alert
    for (const alert of unsentAlerts || []) {
      await this.scheduleAlertNotification(alert);
    }
  }

  private async scheduleAlertNotification(alert: any): Promise<void> {
    console.log('📧 [ALERT-MANAGER] Scheduling notification for alert:', alert.id);

    // Get admin users to notify
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ [ALERT-MANAGER] Failed to get admin users:', adminError);
      return;
    }

    // Schedule notifications for each admin
    for (const admin of adminUsers || []) {
      const { error: queueError } = await supabase
        .from('email_notification_queue')
        .insert({
          user_id: admin.user_id,
          subject: `System Alert: ${alert.title}`,
          body_text: `
Alert Type: ${alert.alert_type}
Severity: ${alert.severity}
Source: ${alert.source_system}

${alert.message}

Please check the system dashboard for more details.
          `.trim(),
          priority: alert.severity === 'critical' ? 1 : 3
        });

      if (queueError) {
        console.error('❌ [ALERT-MANAGER] Failed to queue notification:', queueError);
      }
    }

    // Mark alert as notification sent
    await supabase
      .from('system_alerts')
      .update({ notification_sent: true })
      .eq('id', alert.id);
  }

  private mapAlertFromDb(dbAlert: any): SystemAlert {
    return {
      id: dbAlert.id,
      alertType: dbAlert.alert_type,
      severity: dbAlert.severity,
      title: dbAlert.title,
      message: dbAlert.message,
      sourceSystem: dbAlert.source_system,
      sourceEntityId: dbAlert.source_entity_id,
      alertData: dbAlert.alert_data,
      status: dbAlert.status,
      acknowledgedBy: dbAlert.acknowledged_by,
      acknowledgedAt: dbAlert.acknowledged_at ? new Date(dbAlert.acknowledged_at) : undefined,
      resolvedBy: dbAlert.resolved_by,
      resolvedAt: dbAlert.resolved_at ? new Date(dbAlert.resolved_at) : undefined,
      resolutionNotes: dbAlert.resolution_notes,
      notificationSent: dbAlert.notification_sent,
      createdAt: new Date(dbAlert.created_at),
      updatedAt: new Date(dbAlert.updated_at)
    };
  }
}

export const systemAlertManager = SystemAlertManager.getInstance();
