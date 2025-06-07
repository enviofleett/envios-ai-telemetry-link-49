
import { supabase } from '@/integrations/supabase/client';

interface NotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  vehicle_alerts: boolean;
  geofence_alerts: boolean;
  maintenance_alerts: boolean;
  system_notifications: boolean;
}

class NotificationPreferencesService {
  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to get user preferences:', error);
        return null;
      }

      // Return default preferences if none found
      return data || {
        user_id: userId,
        email_notifications: true,
        vehicle_alerts: true,
        geofence_alerts: true,
        maintenance_alerts: true,
        system_notifications: true
      };
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to update user preferences:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      return false;
    }
  }

  async canSendEmailNotification(userId: string, notificationType: keyof NotificationPreferences): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    
    if (!preferences) {
      return true; // Default to allowing notifications if preferences can't be loaded
    }

    // Check if email notifications are enabled globally for the user
    if (!preferences.email_notifications) {
      return false;
    }

    // Check specific notification type
    return preferences[notificationType] !== false;
  }

  async getVehicleAlertRecipients(vehicleId: string): Promise<string[]> {
    try {
      console.log('Getting vehicle alert recipients for vehicle:', vehicleId);
      
      // Get vehicle information - using available columns from vehicles table
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, device_id, envio_user_id')
        .eq('id', vehicleId)
        .maybeSingle();

      if (vehicleError) {
        console.error('Failed to get vehicle data:', vehicleError);
        return [];
      }

      if (!vehicle) {
        console.error('Vehicle not found:', vehicleId);
        return [];
      }

      const recipients: string[] = [];

      // Get vehicle owner email if owner exists (using envio_user_id field)
      if (vehicle.envio_user_id) {
        const { data: owner, error: ownerError } = await supabase
          .from('envio_users')
          .select('email, id')
          .eq('id', vehicle.envio_user_id)
          .maybeSingle();

        if (owner && !ownerError) {
          const canNotify = await this.canSendEmailNotification(
            owner.id, 
            'vehicle_alerts'
          );
          if (canNotify && owner.email) {
            recipients.push(owner.email);
          }
        }
      }

      // Get users with admin role for additional notifications
      const { data: adminUsers, error: adminError } = await supabase
        .from('envio_users')
        .select(`
          email, 
          id,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'admin');

      if (adminUsers && !adminError) {
        for (const user of adminUsers) {
          if (user.email) {
            const canNotify = await this.canSendEmailNotification(
              user.id, 
              'vehicle_alerts'
            );
            if (canNotify && !recipients.includes(user.email)) {
              recipients.push(user.email);
            }
          }
        }
      }

      console.log('Found recipients for vehicle alerts:', recipients);
      return recipients;
    } catch (error) {
      console.error('Failed to get vehicle alert recipients:', error);
      return [];
    }
  }
}

export const notificationPreferencesService = new NotificationPreferencesService();
