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

      // Try to fetch from notification_settings table (existing schema)
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification preferences:', error);
        return;
      }

      if (data) {
        // Map existing fields to our interface
        setPreferences({
          ...defaultPreferences,
          email_notifications: data.email_notifications ?? true,
          sms_notifications: data.browser_notifications ?? true, // Map browser to SMS for now
          push_notifications: data.browser_notifications ?? true,
          system_updates: data.import_completion ?? true,
          billing_alerts: data.import_failure ?? true,
          api_status: data.import_progress ?? false,
          // Other fields use defaults since they don't exist in current schema
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

      // Map our interface back to existing schema
      const dbPayload: any = {
        user_id: user.id,
        email_notifications: updatedPreferences.email_notifications,
        browser_notifications: updatedPreferences.push_notifications,
        import_completion: updatedPreferences.system_updates,
        import_failure: updatedPreferences.billing_alerts,
        import_progress: updatedPreferences.api_status,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('notification_settings')
        .upsert(dbPayload);

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

      const dbPayload = {
        user_id: user.id,
        email_notifications: preferences.email_notifications,
        browser_notifications: preferences.push_notifications,
        import_completion: preferences.system_updates,
        import_failure: preferences.billing_alerts,
        import_progress: preferences.api_status,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('notification_settings')
        .upsert(dbPayload);

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
