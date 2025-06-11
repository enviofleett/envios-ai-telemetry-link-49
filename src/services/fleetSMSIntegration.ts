
import { smsService } from './smsService';
import { supabase } from '@/integrations/supabase/client';

export interface FleetSMSNotification {
  recipient: string;
  vehicleId?: string;
  driverName?: string;
  location?: string;
  timestamp?: string;
}

export interface GeofenceViolationSMS extends FleetSMSNotification {
  geofenceName: string;
  violationType: 'entry' | 'exit';
}

export interface MaintenanceReminderSMS extends FleetSMSNotification {
  serviceType: string;
  dueDate: string;
  mileage?: number;
}

export interface TripUpdateSMS extends FleetSMSNotification {
  status: 'started' | 'completed' | 'delayed' | 'emergency';
  eta?: string;
  destination?: string;
}

export interface VehicleAlertSMS extends FleetSMSNotification {
  alertType: 'speed_violation' | 'battery_low' | 'maintenance_due' | 'accident' | 'theft';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
}

class FleetSMSIntegration {
  // Vehicle Alerts
  async sendVehicleAlert(alert: VehicleAlertSMS): Promise<boolean> {
    try {
      const message = await smsService.sendTemplatedSMS(
        alert.recipient,
        'vehicle_alert',
        {
          vehicle_id: alert.vehicleId || 'Unknown',
          alert_type: alert.alertType.replace('_', ' '),
          location: alert.location || 'Unknown location',
          severity: alert.severity,
          details: alert.details || '',
          timestamp: alert.timestamp || new Date().toLocaleString()
        }
      );

      return message.success;
    } catch (error) {
      console.error('Failed to send vehicle alert SMS:', error);
      return false;
    }
  }

  // Geofence Violations
  async sendGeofenceViolation(violation: GeofenceViolationSMS): Promise<boolean> {
    try {
      const message = await smsService.sendTemplatedSMS(
        violation.recipient,
        'geofence_violation',
        {
          vehicle_id: violation.vehicleId || 'Unknown',
          violation_type: violation.violationType === 'entry' ? 'entered' : 'exited',
          geofence_name: violation.geofenceName,
          location: violation.location || 'Unknown location',
          timestamp: violation.timestamp || new Date().toLocaleString()
        }
      );

      return message.success;
    } catch (error) {
      console.error('Failed to send geofence violation SMS:', error);
      return false;
    }
  }

  // Maintenance Reminders
  async sendMaintenanceReminder(reminder: MaintenanceReminderSMS): Promise<boolean> {
    try {
      const message = await smsService.sendTemplatedSMS(
        reminder.recipient,
        'maintenance_reminder',
        {
          vehicle_id: reminder.vehicleId || 'Unknown',
          service_type: reminder.serviceType,
          due_date: reminder.dueDate,
          driver_name: reminder.driverName || 'Driver',
          mileage: reminder.mileage?.toString() || 'N/A'
        }
      );

      return message.success;
    } catch (error) {
      console.error('Failed to send maintenance reminder SMS:', error);
      return false;
    }
  }

  // Trip Updates
  async sendTripUpdate(update: TripUpdateSMS): Promise<boolean> {
    try {
      const message = await smsService.sendTemplatedSMS(
        update.recipient,
        'trip_update',
        {
          vehicle_id: update.vehicleId || 'Unknown',
          status: update.status,
          eta: update.eta || 'Unknown',
          destination: update.destination || 'Unknown',
          driver_name: update.driverName || 'Driver'
        }
      );

      return message.success;
    } catch (error) {
      console.error('Failed to send trip update SMS:', error);
      return false;
    }
  }

  // Emergency Alerts
  async sendEmergencyAlert(alert: VehicleAlertSMS & { emergencyContacts: string[] }): Promise<boolean[]> {
    const results: boolean[] = [];
    
    const emergencyMessage = `🚨 EMERGENCY ALERT 🚨\nVehicle: ${alert.vehicleId}\nType: ${alert.alertType}\nLocation: ${alert.location}\nTime: ${alert.timestamp || new Date().toLocaleString()}\n\nImmediate action required. Contact fleet manager.`;

    for (const contact of alert.emergencyContacts) {
      try {
        const result = await smsService.sendSMS(contact, emergencyMessage, 'EMERGENCY_ALERT');
        results.push(result.success);
      } catch (error) {
        console.error(`Failed to send emergency alert to ${contact}:`, error);
        results.push(false);
      }
    }

    return results;
  }

  // Bulk Fleet Notifications
  async sendFleetAnnouncement(recipients: string[], message: string, title?: string): Promise<boolean[]> {
    const fullMessage = title 
      ? `${title}\n\n${message}\n\n- FleetIQ Management`
      : `${message}\n\n- FleetIQ Management`;

    return await smsService.sendBulkSMS(recipients, fullMessage, 'FLEET_ANNOUNCEMENT');
  }

  // Driver Check-in/Check-out
  async sendDriverStatusUpdate(
    recipient: string, 
    driverName: string, 
    status: 'checked_in' | 'checked_out',
    vehicleId: string,
    location?: string
  ): Promise<boolean> {
    try {
      const statusText = status === 'checked_in' ? 'checked in' : 'checked out';
      const message = `Driver Update: ${driverName} has ${statusText} ${vehicleId}${location ? ` at ${location}` : ''}. Time: ${new Date().toLocaleString()}`;

      const result = await smsService.sendSMS(recipient, message, 'DRIVER_STATUS');
      return result.success;
    } catch (error) {
      console.error('Failed to send driver status update:', error);
      return false;
    }
  }

  // Workshop Appointment Reminders
  async sendWorkshopReminder(
    recipient: string,
    vehicleId: string,
    appointmentDate: string,
    workshopName: string,
    serviceType: string
  ): Promise<boolean> {
    try {
      const message = `Workshop Reminder: ${vehicleId} is scheduled for ${serviceType} at ${workshopName} on ${appointmentDate}. Please ensure vehicle is available.`;

      const result = await smsService.sendSMS(recipient, message, 'WORKSHOP_REMINDER');
      return result.success;
    } catch (error) {
      console.error('Failed to send workshop reminder:', error);
      return false;
    }
  }

  // Subscription and Billing Notifications
  async sendBillingNotification(
    recipient: string,
    notificationType: 'payment_due' | 'payment_overdue' | 'payment_received' | 'subscription_expiring',
    amount?: number,
    dueDate?: string
  ): Promise<boolean> {
    try {
      let message = '';
      
      switch (notificationType) {
        case 'payment_due':
          message = `FleetIQ: Payment of $${amount} is due on ${dueDate}. Please process payment to avoid service interruption.`;
          break;
        case 'payment_overdue':
          message = `FleetIQ: Payment of $${amount} is overdue. Please pay immediately to restore services.`;
          break;
        case 'payment_received':
          message = `FleetIQ: Payment of $${amount} received successfully. Thank you for your business.`;
          break;
        case 'subscription_expiring':
          message = `FleetIQ: Your subscription expires on ${dueDate}. Renew now to continue uninterrupted service.`;
          break;
      }

      const result = await smsService.sendSMS(recipient, message, 'BILLING_NOTIFICATION');
      return result.success;
    } catch (error) {
      console.error('Failed to send billing notification:', error);
      return false;
    }
  }

  // Get SMS preferences for a user
  async getUserSMSPreferences(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_email_preferences')
        .select('sms_notifications, sms_trip_updates, sms_maintenance_alerts, sms_violation_alerts')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.warn('Could not fetch SMS preferences:', error);
        return {
          sms_notifications: true,
          sms_trip_updates: false,
          sms_maintenance_alerts: false,
          sms_violation_alerts: true
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching SMS preferences:', error);
      return null;
    }
  }

  // Check if SMS should be sent based on user preferences
  async shouldSendSMS(userId: string, notificationType: string): Promise<boolean> {
    const preferences = await this.getUserSMSPreferences(userId);
    if (!preferences) return false;

    switch (notificationType) {
      case 'trip_update':
        return preferences.sms_trip_updates;
      case 'maintenance_alert':
        return preferences.sms_maintenance_alerts;
      case 'violation_alert':
        return preferences.sms_violation_alerts;
      default:
        return preferences.sms_notifications;
    }
  }
}

export const fleetSMSIntegration = new FleetSMSIntegration();
