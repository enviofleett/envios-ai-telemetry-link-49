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
      
      // Get vehicle information using correct column names
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, user_id') // Use correct column names
        .eq('id', vehicleId)
        .maybeSingle();

      if (vehicleError) {
        console.error('Error fetching vehicle:', vehicleError);
        return [];
      }

      if (!vehicle) {
        console.log('Vehicle not found:', vehicleId);
        return [];
      }

      // If vehicle has an assigned user, get their email
      if (vehicle.user_id) {
        const { data: user, error: userError } = await supabase
          .from('envio_users')
          .select('email')
          .eq('id', vehicle.user_id)
          .maybeSingle();

        if (userError) {
          console.error('Error fetching user:', userError);
          return [];
        }

        if (user?.email) {
          // Check if user wants to receive vehicle alerts
          const canReceive = await this.canSendEmailNotification(vehicle.user_id, 'vehicle_alerts');
          if (canReceive) {
            return [user.email];
          }
        }
      }

      return [];
    } catch (error) {
      console.error('Error getting vehicle alert recipients:', error);
      return [];
    }
  }
}

export const notificationPreferencesService = new NotificationPreferencesService();
