
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationPreferences {
  // Map to actual database fields
  email_notifications: boolean;
  maintenance_reminders: boolean;
  system_updates: boolean;
  marketing_emails: boolean;
  weekly_reports: boolean;
  
  // SMS notifications (these exist in DB)
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
  
  // Default preferences mapped to actual database fields
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    // Email preferences (existing fields)
    email_notifications: true,
    maintenance_reminders: true,
    system_updates: false,
    marketing_emails: false,
    weekly_reports: false,
    
    // SMS preferences (new fields)
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
          // Map existing database fields
          email_notifications: data.email_notifications ?? true,
          maintenance_reminders: data.maintenance_reminders ?? true,
          system_updates: data.system_updates ?? false,
          marketing_emails: data.marketing_emails ?? false,
          weekly_reports: data.weekly_reports ?? false,
          
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
