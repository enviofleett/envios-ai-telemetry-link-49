
import { emailTriggerService } from './emailTriggerService';
import { supabase } from '@/integrations/supabase/client';

export class SystemEmailTriggers {
  // Send system maintenance notifications
  static async onSystemMaintenance(
    startTime: Date,
    endTime: Date,
    description: string,
    affectedServices: string[]
  ): Promise<void> {
    try {
      console.log('🔧 Sending system maintenance notifications...');
      
      // Get all active users
      const { data: users } = await supabase
        .from('envio_users')
        .select('email, name')
        .eq('registration_status', 'active');

      if (!users || users.length === 0) {
        console.log('ℹ️ No active users to notify');
        return;
      }

      const userEmails = users.map(user => user.email);
      
      await emailTriggerService.sendBulkTriggeredEmail(userEmails, {
        trigger_type: 'system_maintenance',
        template_variables: {
          maintenance_start: startTime.toLocaleString(),
          maintenance_end: endTime.toLocaleString(),
          maintenance_description: description,
          affected_services: affectedServices.join(', '),
          status_page_link: `${window.location.origin}/status`
        },
        fallback_subject: 'Scheduled System Maintenance',
        fallback_message: `System maintenance is scheduled from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}. ${description}`
      });

      console.log(`✅ System maintenance notifications sent to ${userEmails.length} users`);
    } catch (error) {
      console.error('❌ Failed to send system maintenance notifications:', error);
    }
  }

  // Send security alerts
  static async onSecurityAlert(
    alertType: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    affectedUsers?: string[]
  ): Promise<void> {
    try {
      console.log(`🚨 Sending security alert: ${alertType} (${severity})`);
      
      let recipients: string[] = [];
      
      if (affectedUsers && affectedUsers.length > 0) {
        // Send to specific users
        recipients = affectedUsers;
      } else {
        // Send to all admins for system-wide alerts
        const { data: adminUsers } = await supabase
          .from('envio_users')
          .select(`
            email,
            user_roles!inner(role)
          `)
          .eq('user_roles.role', 'admin');

        recipients = adminUsers?.map(user => user.email) || [];
      }

      if (recipients.length === 0) {
        console.log('ℹ️ No recipients for security alert');
        return;
      }

      await emailTriggerService.sendBulkTriggeredEmail(recipients, {
        trigger_type: 'security_alert',
        template_variables: {
          alert_type: alertType,
          alert_description: description,
          alert_severity: severity,
          alert_timestamp: new Date().toLocaleString(),
          security_center_link: `${window.location.origin}/admin/security`
        },
        fallback_subject: `Security Alert: ${alertType}`,
        fallback_message: `Security Alert (${severity}): ${description}`
      });

      console.log(`✅ Security alerts sent to ${recipients.length} recipients`);
    } catch (error) {
      console.error('❌ Failed to send security alerts:', error);
    }
  }

  // Send billing notifications
  static async onBillingEvent(
    userId: string,
    eventType: 'payment_failed' | 'payment_success' | 'subscription_expiring' | 'subscription_expired',
    amount?: number,
    expiryDate?: Date
  ): Promise<void> {
    try {
      console.log(`💳 Sending billing notification: ${eventType} for user ${userId}`);
      
      // Get user details
      const { data: user } = await supabase
        .from('envio_users')
        .select('email, name')
        .eq('id', userId)
        .single();

      if (!user) {
        console.log('❌ User not found for billing notification');
        return;
      }

      let subject = '';
      let templateVariables: Record<string, string> = {
        user_name: user.name,
        event_type: eventType,
        event_date: new Date().toLocaleDateString()
      };

      switch (eventType) {
        case 'payment_failed':
          subject = 'Payment Failed - Action Required';
          if (amount) templateVariables.amount = amount.toString();
          break;
        case 'payment_success':
          subject = 'Payment Confirmation';
          if (amount) templateVariables.amount = amount.toString();
          break;
        case 'subscription_expiring':
          subject = 'Subscription Expiring Soon';
          if (expiryDate) templateVariables.expiry_date = expiryDate.toLocaleDateString();
          break;
        case 'subscription_expired':
          subject = 'Subscription Expired';
          break;
      }

      await emailTriggerService.sendTriggeredEmail({
        to: user.email,
        trigger_type: 'billing_notification',
        template_variables: templateVariables,
        related_entity_id: userId,
        fallback_subject: subject,
        fallback_message: `Billing notification: ${eventType}`
      });

      console.log(`✅ Billing notification sent to ${user.email}`);
    } catch (error) {
      console.error('❌ Failed to send billing notification:', error);
    }
  }
}
