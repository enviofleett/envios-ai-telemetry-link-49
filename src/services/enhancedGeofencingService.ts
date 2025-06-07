
import { geofencingService } from './geofencing';
import { useVehicleManagementEmails } from '@/hooks/useVehicleManagementEmails';
import { notificationPreferencesService } from './notificationPreferencesService';

class EnhancedGeofencingService {
  private geofencingService = geofencingService;

  async checkVehicleInGeofencesWithNotifications(deviceId: string, lat: number, lng: number): Promise<void> {
    try {
      // Check for geofence violations
      const alerts = await this.geofencingService.checkVehicleInGeofences(deviceId, lat, lng);
      
      if (alerts.length === 0) return;

      // Get vehicle information
      const vehicle = await this.getVehicleInfo(deviceId);
      if (!vehicle) return;

      // Get recipients for this vehicle
      const recipients = await notificationPreferencesService.getVehicleAlertRecipients(vehicle.id);

      // Send email notifications for each alert
      for (const alert of alerts) {
        const geofence = await this.getGeofenceInfo(alert.geofence_id);
        if (!geofence) continue;

        // Send emails to all recipients
        for (const recipientEmail of recipients) {
          try {
            // Use the email service (we'll need to access this differently in a service)
            console.log(`Sending geofence alert email to ${recipientEmail} for vehicle ${vehicle.name}`);
            
            // This would normally be called through a hook, but in a service we need to use the direct service
            await this.sendGeofenceAlertEmail(
              recipientEmail,
              vehicle.name || vehicle.device_id,
              geofence.name,
              alert.alert_type,
              alert.location
            );
          } catch (error) {
            console.error(`Failed to send geofence alert email to ${recipientEmail}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error in enhanced geofence checking:', error);
    }
  }

  private async getVehicleInfo(deviceId: string) {
    // This would typically query the vehicles table
    // For now, return a mock response
    return {
      id: deviceId,
      device_id: deviceId,
      name: `Vehicle ${deviceId}`,
      license_plate: `LP-${deviceId}`
    };
  }

  private async getGeofenceInfo(geofenceId: string) {
    const geofences = await this.geofencingService.getGeofences();
    return geofences.find(g => g.id === geofenceId);
  }

  private async sendGeofenceAlertEmail(
    recipientEmail: string,
    vehicleName: string,
    geofenceName: string,
    alertType: 'enter' | 'exit',
    location: { lat: number; lng: number }
  ) {
    // Direct email sending without hooks (for service usage)
    const actionText = alertType === 'enter' ? 'entered' : 'exited';
    
    // This would use the SMTP service directly
    console.log(`Geofence Alert: ${vehicleName} has ${actionText} ${geofenceName} at ${location.lat}, ${location.lng}`);
  }

  async monitorVehicleLocation(deviceId: string, lat: number, lng: number) {
    // This would be called by the vehicle tracking system
    await this.checkVehicleInGeofencesWithNotifications(deviceId, lat, lng);
  }
}

export const enhancedGeofencingService = new EnhancedGeofencingService();
