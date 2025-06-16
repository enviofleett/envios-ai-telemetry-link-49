import { geofencingService } from './geofencing';
import { notificationPreferencesService } from './notificationPreferencesService';
import { supabase } from '@/integrations/supabase/client';

export class EnhancedGeofencingService {
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
            console.log(`Sending geofence alert email to ${recipientEmail} for vehicle ${vehicle.name}`);
            
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
    try {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('id, device_id, device_name')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (error || !vehicle) {
        console.error('Failed to get vehicle info:', error);
        return null;
      }

      return {
        id: vehicle.id,
        device_id: vehicle.device_id,
        name: vehicle.device_name || `Vehicle ${vehicle.device_id}`
      };
    } catch (error) {
      console.error('Error getting vehicle info:', error);
      return null;
    }
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
    try {
      // Call the SMTP service to send the email
      const { error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          action: 'send-email',
          recipientEmail,
          subject: `Geofence Alert: ${vehicleName} ${alertType === 'enter' ? 'entered' : 'exited'} ${geofenceName}`,
          htmlContent: `
            <h2>Geofence Alert</h2>
            <p><strong>Vehicle:</strong> ${vehicleName}</p>
            <p><strong>Action:</strong> ${alertType === 'enter' ? 'Entered' : 'Exited'}</p>
            <p><strong>Geofence:</strong> ${geofenceName}</p>
            <p><strong>Location:</strong> ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p>Please review and take appropriate action if required.</p>
          `,
          textContent: `Geofence Alert: ${vehicleName} has ${alertType === 'enter' ? 'entered' : 'exited'} ${geofenceName} at ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)} on ${new Date().toLocaleString()}`
        }
      });

      if (error) {
        console.error('Failed to send geofence alert email:', error);
      }
    } catch (error) {
      console.error('Error sending geofence alert email:', error);
    }
  }

  async getVehiclesInGeofence(geofenceId: string): Promise<any[]> {
    try {
      console.log(`🗺️ Getting vehicles in geofence ${geofenceId}`);

      // Get vehicles with their latest positions
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name');

      if (error) {
        console.error('Error fetching vehicles for geofence check:', error);
        return [];
      }

      if (!vehicles) {
        return [];
      }

      // For now, return empty array since we don't have position data
      // In a real implementation, you would check each vehicle's current position
      // against the geofence boundaries
      const vehiclesInGeofence = vehicles.map(vehicle => ({
        vehicleId: vehicle.id,
        deviceId: vehicle.gp51_device_id,
        deviceName: vehicle.name || vehicle.gp51_device_id,
        isInGeofence: false, // Would be calculated based on position data
        entryTime: null,
        exitTime: null
      }));

      return vehiclesInGeofence;

    } catch (error) {
      console.error('Exception getting vehicles in geofence:', error);
      return [];
    }
  }

  async monitorVehicleLocation(deviceId: string, lat: number, lng: number) {
    // This would be called by the vehicle tracking system
    await this.checkVehicleInGeofencesWithNotifications(deviceId, lat, lng);
  }
}

export const enhancedGeofencingService = new EnhancedGeofencingService();
