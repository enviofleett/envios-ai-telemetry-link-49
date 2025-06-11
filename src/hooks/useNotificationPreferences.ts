
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationPreferences {
  // Email notifications
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
  push_notifications: boolean;
  webhook_notifications: boolean;
  
  // SMS notifications
  sms_notifications: boolean;
  sms_otp_verification: boolean;
  sms_trip_updates: boolean;
  sms_maintenance_alerts: boolean;
  sms_violation_alerts: boolean;
}

export const useNotificationPreferences = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Default preferences
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    // Email preferences
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
    email_notifications: true,
    push_notifications: true,
    webhook_notifications: false,
    
    // SMS preferences
    sms_notifications: true,
    sms_otp_verification: true,
    sms_trip_updates: false,
    sms_maintenance_alerts: false,
    sms_violation_alerts: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_email_preferences')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
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
          system_updates: data.system_updates ?? false,
          daily_reports: data.daily_reports ?? false,
          billing_alerts: data.billing_alerts ?? true,
          api_status: data.api_status ?? false,
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          webhook_notifications: data.webhook_notifications ?? false,
          
          // SMS preferences
          sms_notifications: data.sms_notifications ?? true,
          sms_otp_verification: data.sms_otp_verification ?? true,
          sms_trip_updates: data.sms_trip_updates ?? false,
          sms_maintenance_alerts: data.sms_maintenance_alerts ?? false,
          sms_violation_alerts: data.sms_violation_alerts ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveAllPreferences = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_email_preferences')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          ...preferences
        });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save notification preferences. Please try again.",
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
    saveAllPreferences,
    loadPreferences
  };
};
