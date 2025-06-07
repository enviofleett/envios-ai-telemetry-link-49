
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
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
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

      if (error) throw error;
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
      // Get vehicle owners and fleet managers
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select(`
          *,
          envio_users!vehicles_owner_id_fkey(email, id)
        `)
        .eq('id', vehicleId)
        .single();

      if (vehicleError || !vehicle) {
        console.error('Failed to get vehicle data:', vehicleError);
        return [];
      }

      const recipients: string[] = [];

      // Add vehicle owner if they have notifications enabled
      if (vehicle.envio_users?.email) {
        const canNotify = await this.canSendEmailNotification(
          vehicle.envio_users.id, 
          'vehicle_alerts'
        );
        if (canNotify) {
          recipients.push(vehicle.envio_users.email);
        }
      }

      // Get fleet managers for this vehicle's groups
      const { data: groupAssignments } = await supabase
        .from('device_group_assignments')
        .select(`
          device_groups(
            user_group_assignments(
              envio_users(email, id)
            )
          )
        `)
        .eq('device_id', vehicleId);

      if (groupAssignments) {
        for (const assignment of groupAssignments) {
          const deviceGroups = assignment.device_groups as any;
          if (deviceGroups?.user_group_assignments) {
            for (const userAssignment of deviceGroups.user_group_assignments) {
              const user = userAssignment.envio_users;
              if (user?.email) {
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
        }
      }

      return recipients;
    } catch (error) {
      console.error('Failed to get vehicle alert recipients:', error);
      return [];
    }
  }
}

export const notificationPreferencesService = new NotificationPreferencesService();
