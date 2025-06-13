
import { emailTriggerService } from './emailTriggerService';
import { notificationPreferencesService } from '@/services/notificationPreferencesService';

export class VehicleEmailTriggers {
  // Trigger vehicle offline alert
  static async onVehicleOffline(
    vehicleId: string,
    vehicleName: string,
    deviceId: string,
    lastContactTime: Date,
    lastKnownLocation: string
  ): Promise<void> {
    try {
      console.log(`🚗 Vehicle ${vehicleName} went offline, triggering alerts...`);
      
      // Get recipients who should receive vehicle alerts
      const recipients = await notificationPreferencesService.getVehicleAlertRecipients(vehicleId);
      
      if (recipients.length === 0) {
        console.log('ℹ️ No recipients configured for vehicle alerts');
        return;
      }

      const lastContact = lastContactTime.toLocaleString();
      
      // Send alerts to all configured recipients
      for (const recipientEmail of recipients) {
        await emailTriggerService.sendVehicleOfflineAlert(
          recipientEmail,
          vehicleName,
          deviceId,
          lastContact,
          lastKnownLocation,
          vehicleId
        );
      }

      console.log(`✅ Vehicle offline alerts sent to ${recipients.length} recipients`);
    } catch (error) {
      console.error('❌ Failed to trigger vehicle offline alerts:', error);
    }
  }

  // Trigger maintenance reminder
  static async onMaintenanceDue(
    vehicleId: string,
    vehicleName: string,
    maintenanceType: string,
    dueDate: Date,
    ownerEmail?: string
  ): Promise<void> {
    try {
      console.log(`🔧 Maintenance due for vehicle ${vehicleName}, sending reminders...`);
      
      const recipients = await notificationPreferencesService.getVehicleAlertRecipients(vehicleId);
      
      // Add vehicle owner if provided and not already in recipients
      if (ownerEmail && !recipients.includes(ownerEmail)) {
        recipients.push(ownerEmail);
      }

      if (recipients.length === 0) {
        console.log('ℹ️ No recipients configured for maintenance reminders');
        return;
      }

      const dueDateString = dueDate.toLocaleDateString();
      
      // Send maintenance reminders to all recipients
      for (const recipientEmail of recipients) {
        await emailTriggerService.sendMaintenanceReminder(
          recipientEmail,
          vehicleName,
          maintenanceType,
          dueDateString,
          vehicleId
        );
      }

      console.log(`✅ Maintenance reminders sent to ${recipients.length} recipients`);
    } catch (error) {
      console.error('❌ Failed to trigger maintenance reminders:', error);
    }
  }

  // Trigger geofence alert
  static async onGeofenceViolation(
    vehicleId: string,
    vehicleName: string,
    geofenceName: string,
    violationType: 'entered' | 'exited',
    location: { lat: number; lng: number },
    timestamp: Date
  ): Promise<void> {
    try {
      console.log(`🚨 Geofence violation for vehicle ${vehicleName}`);
      
      const recipients = await notificationPreferencesService.getVehicleAlertRecipients(vehicleId);
      
      if (recipients.length === 0) {
        console.log('ℹ️ No recipients configured for geofence alerts');
        return;
      }

      const locationString = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      const timestampString = timestamp.toLocaleString();
      
      // Send geofence alerts
      await emailTriggerService.sendBulkTriggeredEmail(recipients, {
        trigger_type: 'geofence_alert',
        template_variables: {
          vehicle_name: vehicleName,
          geofence_name: geofenceName,
          violation_type: violationType,
          location: locationString,
          timestamp: timestampString,
          vehicle_details_link: `${window.location.origin}/vehicles/${vehicleId}`
        },
        related_entity_id: vehicleId,
        fallback_subject: `Geofence Alert: ${vehicleName}`,
        fallback_message: `Vehicle ${vehicleName} ${violationType} geofence "${geofenceName}" at ${timestampString}`
      });

      console.log(`✅ Geofence alerts sent to ${recipients.length} recipients`);
    } catch (error) {
      console.error('❌ Failed to trigger geofence alerts:', error);
    }
  }
}
