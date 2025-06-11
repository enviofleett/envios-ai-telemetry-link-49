
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  enabled: boolean;
  description: string;
  settings?: Record<string, any>;
}

export interface NotificationSettings {
  channels: NotificationChannel[];
  globalSettings: {
    fromName: string;
    fromEmail: string;
    replyTo: string;
    smsVendor?: string;
    trackEmailOpens: boolean;
    includeUnsubscribe: boolean;
  };
  notificationTypes: Array<{
    id: string;
    name: string;
    description: string;
    channels: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  }>;
}

export const useNotificationSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: async (): Promise<NotificationSettings> => {
      // Use company_settings table instead of non-existent email_notification_settings
      const { data: companySettings, error: companyError } = await supabase
        .from('company_settings')
        .select('contact_email, company_name')
        .single();

      // Return default settings structure with fallback values
      return {
        channels: [
          {
            id: 'email',
            name: 'Email',
            type: 'email',
            enabled: true,
            description: 'Send notifications via email',
            settings: {}
          },
          {
            id: 'sms',
            name: 'SMS',
            type: 'sms',
            enabled: false,
            description: 'Send notifications via SMS'
          },
          {
            id: 'push',
            name: 'Push Notifications',
            type: 'push',
            enabled: true,
            description: 'Send browser push notifications'
          }
        ],
        globalSettings: {
          fromName: companySettings?.company_name || 'FleetIQ System',
          fromEmail: companySettings?.contact_email || 'noreply@fleetiq.com',
          replyTo: companySettings?.contact_email || 'support@fleetiq.com',
          trackEmailOpens: true,
          includeUnsubscribe: true
        },
        notificationTypes: [
          {
            id: 'vehicle_alerts',
            name: 'Vehicle Alerts',
            description: 'Alerts for vehicle issues and maintenance',
            channels: { email: true, sms: false, push: true }
          },
          {
            id: 'user_actions',
            name: 'User Actions',
            description: 'Notifications for user registrations and updates',
            channels: { email: true, sms: false, push: false }
          },
          {
            id: 'system_events',
            name: 'System Events',
            description: 'System maintenance and updates',
            channels: { email: true, sms: true, push: true }
          },
          {
            id: 'billing',
            name: 'Billing',
            description: 'Payment and subscription notifications',
            channels: { email: true, sms: false, push: false }
          }
        ]
      };
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<NotificationSettings>) => {
      // Update company settings instead of non-existent table
      const { error } = await supabase
        .from('company_settings')
        .update({
          company_name: updates.globalSettings?.fromName,
          contact_email: updates.globalSettings?.fromEmail,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success('Notification settings updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update settings: ${error.message}`);
    }
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending
  };
};
