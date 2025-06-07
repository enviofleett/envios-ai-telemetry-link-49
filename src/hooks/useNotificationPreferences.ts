
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
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

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    vehicle_online_offline: true,
    low_battery_alerts: true,
    maintenance_due: true,
    engine_diagnostics: true,
    geofence_violations: true,
    speeding_alerts: true,
    unauthorized_use: true,
    panic_button: true,
    system_updates: true,
    daily_reports: false,
    billing_alerts: true,
    api_status: false,
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    webhook_notifications: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading - in a real app, this would fetch from the database
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const saveAllPreferences = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated."
      });
    } catch (error) {
      toast({
        title: "Error",
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
