
import { supabase } from '@/integrations/supabase/client';

export interface EmailTriggerOptions {
  to: string;
  trigger_type: string;
  template_variables?: Record<string, string>;
  related_entity_id?: string;
  fallback_subject?: string;
  fallback_message?: string;
}

class EmailTriggerService {
  async sendTriggeredEmail(options: EmailTriggerOptions): Promise<boolean> {
    try {
      console.log(`🔔 Triggering email: ${options.trigger_type} to ${options.to}`);
      
      const { data, error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          to: options.to,
          trigger_type: options.trigger_type,
          template_variables: options.template_variables || {},
          related_entity_id: options.related_entity_id,
          // Fallback for direct sending if template not found
          subject: options.fallback_subject,
          message: options.fallback_message
        }
      });

      if (error) {
        console.error(`❌ Email trigger failed for ${options.trigger_type}:`, error);
        return false;
      }

      console.log(`✅ Email triggered successfully:`, data);
      return true;
    } catch (error) {
      console.error(`💥 Unexpected error in email trigger:`, error);
      return false;
    }
  }

  // User Registration Welcome Email
  async sendUserRegistrationWelcome(userEmail: string, userName: string, companyName?: string): Promise<boolean> {
    return this.sendTriggeredEmail({
      to: userEmail,
      trigger_type: 'user_registration',
      template_variables: {
        user_name: userName,
        user_email: userEmail,
        company_name: companyName || 'FleetIQ',
        registration_date: new Date().toLocaleDateString(),
        verification_link: `${window.location.origin}/verify-email`
      },
      fallback_subject: `Welcome to FleetIQ, ${userName}!`,
      fallback_message: `Welcome to FleetIQ! Your account has been created successfully. Please verify your email to get started.`
    });
  }

  // Password Reset Email
  async sendPasswordReset(userEmail: string, userName: string, resetLink: string): Promise<boolean> {
    return this.sendTriggeredEmail({
      to: userEmail,
      trigger_type: 'password_reset',
      template_variables: {
        user_name: userName,
        reset_link: resetLink,
        expiry_hours: '24'
      },
      fallback_subject: 'Reset Your FleetIQ Password',
      fallback_message: `Hello ${userName}, please use this link to reset your password: ${resetLink}`
    });
  }

  // Vehicle Offline Alert
  async sendVehicleOfflineAlert(
    recipientEmail: string, 
    vehicleName: string, 
    deviceId: string,
    lastContact: string,
    lastLocation: string,
    vehicleId: string
  ): Promise<boolean> {
    return this.sendTriggeredEmail({
      to: recipientEmail,
      trigger_type: 'vehicle_offline_alert',
      template_variables: {
        vehicle_name: vehicleName,
        device_id: deviceId,
        last_contact_time: lastContact,
        last_known_location: lastLocation,
        vehicle_details_link: `${window.location.origin}/vehicles/${vehicleId}`
      },
      related_entity_id: vehicleId,
      fallback_subject: `Vehicle Alert: ${vehicleName} is Offline`,
      fallback_message: `Vehicle ${vehicleName} (${deviceId}) has been offline since ${lastContact}. Last known location: ${lastLocation}`
    });
  }

  // Vehicle Maintenance Reminder
  async sendMaintenanceReminder(
    recipientEmail: string,
    vehicleName: string,
    maintenanceType: string,
    dueDate: string,
    vehicleId: string
  ): Promise<boolean> {
    return this.sendTriggeredEmail({
      to: recipientEmail,
      trigger_type: 'maintenance_reminder',
      template_variables: {
        vehicle_name: vehicleName,
        maintenance_type: maintenanceType,
        due_date: dueDate,
        vehicle_details_link: `${window.location.origin}/vehicles/${vehicleId}`
      },
      related_entity_id: vehicleId,
      fallback_subject: `Maintenance Reminder: ${vehicleName}`,
      fallback_message: `Vehicle ${vehicleName} is due for ${maintenanceType} on ${dueDate}.`
    });
  }

  // System Notification Email
  async sendSystemNotification(
    recipientEmail: string,
    subject: string,
    message: string,
    notificationType: 'info' | 'warning' | 'error' = 'info'
  ): Promise<boolean> {
    return this.sendTriggeredEmail({
      to: recipientEmail,
      trigger_type: 'system_notification',
      template_variables: {
        notification_type: notificationType,
        notification_subject: subject,
        notification_message: message,
        notification_date: new Date().toLocaleDateString()
      },
      fallback_subject: subject,
      fallback_message: message
    });
  }

  // Bulk email for multiple recipients
  async sendBulkTriggeredEmail(recipients: string[], triggerOptions: Omit<EmailTriggerOptions, 'to'>): Promise<number> {
    let successCount = 0;
    
    for (const recipient of recipients) {
      const success = await this.sendTriggeredEmail({
        ...triggerOptions,
        to: recipient
      });
      
      if (success) {
        successCount++;
      }
      
      // Small delay to avoid overwhelming the email service
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`📊 Bulk email sent to ${successCount}/${recipients.length} recipients`);
    return successCount;
  }
}

export const emailTriggerService = new EmailTriggerService();
