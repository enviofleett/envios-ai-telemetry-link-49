
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationPreferences {
  // Vehicle Status Alerts
  vehicle_online_offline: boolean;
  low_battery_alerts: boolean;
  maintenance_due: boolean;
  engine_diagnostics: boolean;
  
  // Geofence & Security
  geofence_violations: boolean;
  speeding_alerts: boolean;
  unauthorized_use: boolean;
  panic_button: boolean;
  
  // System Notifications
  system_updates: boolean;
  daily_reports: boolean;
  billing_alerts: boolean;
  api_status: boolean;
  
  // Delivery Methods
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  webhook_notifications: boolean;
}

const defaultPreferences: NotificationPreferences = {
  vehicle_online_offline: true,
  low_battery_alerts: true,
  maintenance_due: true,
  engine_diagnostics: false,
  geofence_violations: true,
  speeding_alerts: true,
  unauthorized_use: true,
  panic_button: true,
  system_updates: true,
  daily_reports: true,
  billing_alerts: true,
  api_status: false,
  email_notifications: true,
  sms_notifications: true,
  push_notifications: true,
  webhook_notifications: false,
};

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to fetch from user_notification_preferences table first
      let { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // If table doesn't exist or no data, fall back to existing notification_settings table
      if (error || !data) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fallbackError && fallbackError.code !== 'PGRST116') {
          console.error('Error fetching notification preferences:', fallbackError);
          return;
        }

        if (fallbackData) {
          // Map existing fields to new structure
          setPreferences({
            ...defaultPreferences,
            email_notifications: fallbackData.email_notifications ?? true,
            // Map other existing fields as available
            system_updates: fallbackData.import_completion ?? true,
            billing_alerts: fallbackData.import_failure ?? true,
          });
        }
        return;
      }

      if (data) {
        setPreferences({
          vehicle_online_offline: data.vehicle_online_offline ?? true,
          low_battery_alerts: data.low_battery_alerts ?? true,
          maintenance_due: data.maintenance_due ?? true,
          engine_diagnostics: data.engine_diagnostics ?? false,
          geofence_violations: data.geofence_violations ?? true,
          speeding_alerts: data.speeding_alerts ?? true,
          unauthorized_use: data.unauthorized_use ?? true,
          panic_button: data.panic_button ?? true,
          system_updates: data.system_updates ?? true,
          daily_reports: data.daily_reports ?? true,
          billing_alerts: data.billing_alerts ?? true,
          api_status: data.api_status ?? false,
          email_notifications: data.email_notifications ?? true,
          sms_notifications: data.sms_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          webhook_notifications: data.webhook_notifications ?? false,
        });
      }
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedPreferences = { ...preferences, [key]: value };
      setPreferences(updatedPreferences);

      // Try to save to user_notification_preferences table
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          ...updatedPreferences,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating notification preferences:', error);
        // Revert the change
        setPreferences(preferences);
        toast({
          title: "Error",
          description: "Failed to update notification preferences",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Notification preferences updated",
        });
      }
    } catch (error) {
      console.error('Error in updatePreference:', error);
      setPreferences(preferences);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllPreferences = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving notification preferences:', error);
        toast({
          title: "Error",
          description: "Failed to save notification preferences",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "All notification preferences saved successfully",
        });
      }
    } catch (error) {
      console.error('Error in saveAllPreferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    preferences,
    isLoading,
    isSaving,
    updatePreference,
    saveAllPreferences
  };
};
