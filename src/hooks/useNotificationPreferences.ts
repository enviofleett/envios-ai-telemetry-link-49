
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationPreferences {
  // Email notifications
  email_notifications: boolean;
  maintenance_reminders: boolean;
  system_updates: boolean;
  marketing_emails: boolean;
  weekly_reports: boolean;
  
  // SMS notifications
  sms_notifications: boolean;
  sms_otp_verification: boolean;
  sms_trip_updates: boolean;
  sms_maintenance_alerts: boolean;
  sms_violation_alerts: boolean;
}

const defaultPreferences: NotificationPreferences = {
  // Email preferences
  email_notifications: true,
  maintenance_reminders: true,
  system_updates: false,
  marketing_emails: false,
  weekly_reports: false,
  
  // SMS preferences
  sms_notifications: true,
  sms_otp_verification: true,
  sms_trip_updates: false,
  sms_maintenance_alerts: false,
  sms_violation_alerts: true,
};

export const useNotificationPreferences = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user found');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        toast({
          title: "Error",
          description: "Failed to load notification preferences",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setPreferences({
          // Map existing database fields
          email_notifications: data.email_notifications ?? defaultPreferences.email_notifications,
          maintenance_reminders: data.maintenance_reminders ?? defaultPreferences.maintenance_reminders,
          system_updates: data.system_updates ?? defaultPreferences.system_updates,
          marketing_emails: data.marketing_emails ?? defaultPreferences.marketing_emails,
          weekly_reports: data.weekly_reports ?? defaultPreferences.weekly_reports,
          
          // SMS preferences
          sms_notifications: data.sms_notifications ?? defaultPreferences.sms_notifications,
          sms_otp_verification: data.sms_otp_verification ?? defaultPreferences.sms_otp_verification,
          sms_trip_updates: data.sms_trip_updates ?? defaultPreferences.sms_trip_updates,
          sms_maintenance_alerts: data.sms_maintenance_alerts ?? defaultPreferences.sms_maintenance_alerts,
          sms_violation_alerts: data.sms_violation_alerts ?? defaultPreferences.sms_violation_alerts,
        });
      } else {
        // No preferences found, use defaults
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreference = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const saveAllPreferences = useCallback(async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { error } = await supabase
        .from('user_email_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
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
  }, [preferences, toast]);

  return {
    preferences,
    isLoading,
    isSaving,
    updatePreference,
    saveAllPreferences,
    loadPreferences
  };
};
