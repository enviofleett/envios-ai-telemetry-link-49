
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  vehicle_online_offline: boolean;
  low_battery_alerts: boolean;
  maintenance_due: boolean;
  engine_diagnostics: boolean;
  geofence_violations: boolean;
  speeding_alerts: boolean;
  unauthorized_use: boolean;
  panic_button: boolean;
  system_updates: boolean;
  daily_reports: boolean;
  billing_alerts: boolean;
  api_status: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  webhook_notifications: boolean;
}

export const useNotificationPreferences = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Default preferences
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    vehicle_online_offline: true,
    low_battery_alerts: true,
    maintenance_due: true,
    engine_diagnostics: false,
    geofence_violations: true,
    speeding_alerts: true,
    unauthorized_use: true,
    panic_button: true,
    system_updates: false,
    daily_reports: false,
    billing_alerts: true,
    api_status: false,
    email_notifications: false, // Disabled since we removed SMTP
    sms_notifications: false,
    push_notifications: true,
    webhook_notifications: false,
  });

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveAllPreferences = async () => {
    setIsSaving(true);
    try {
      // Since we removed SMTP, just simulate saving to localStorage
      localStorage.setItem('notification_preferences', JSON.stringify(preferences));
      
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save notification preferences.",
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
