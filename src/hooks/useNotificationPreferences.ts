
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
      if (!user) {
        // Load from localStorage if no user
        const stored = localStorage.getItem('notificationPreferences');
        if (stored) {
          setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
        }
        setIsLoading(false);
        return;
      }

      // Try to fetch from company_settings table first
      const { data: companyData } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (companyData) {
        // Map basic settings and use defaults for the rest
        setPreferences({
          ...defaultPreferences,
          email_notifications: true,
          system_updates: true,
          billing_alerts: true,
        });
      } else {
        // Use default preferences if no data found
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('notificationPreferences');
      if (stored) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      setIsSaving(true);
      const updatedPreferences = { ...preferences, [key]: value };
      setPreferences(updatedPreferences);

      // Store in localStorage for persistence
      localStorage.setItem('notificationPreferences', JSON.stringify(updatedPreferences));

      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
    } catch (error) {
      console.error('Error in updatePreference:', error);
      // Revert the change
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
      
      // Store in localStorage
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      toast({
        title: "Success",
        description: "All notification preferences saved successfully",
      });
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
