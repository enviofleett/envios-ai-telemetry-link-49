
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SendEmailParams {
  recipientEmail: string;
  templateType: 'otp' | 'welcome' | 'password_reset' | 'vehicle_activation';
  placeholderData?: Record<string, string>;
  smtpConfigId?: string;
}

export const useEmailService = () => {
  const { toast } = useToast();

  const sendEmailMutation = useMutation({
    mutationFn: async (params: SendEmailParams) => {
      const { data, error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          action: 'send-email',
          ...params
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to send email');
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Email has been sent successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const { data: emailLogs, refetch: refetchEmailLogs } = useQuery({
    queryKey: ['email-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_notifications')
        .select(`
          *,
          smtp_configurations(name, host)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  // Helper functions for common email types
  const sendOTPEmail = (email: string, otpCode: string, expiryMinutes = 10) => {
    return sendEmailMutation.mutateAsync({
      recipientEmail: email,
      templateType: 'otp',
      placeholderData: {
        user_name: email.split('@')[0],
        otp_code: otpCode,
        expiry_minutes: expiryMinutes.toString()
      }
    });
  };

  const sendWelcomeEmail = (email: string, userName: string) => {
    return sendEmailMutation.mutateAsync({
      recipientEmail: email,
      templateType: 'welcome',
      placeholderData: {
        user_name: userName
      }
    });
  };

  const sendPasswordResetEmail = (email: string, userName: string, resetLink: string) => {
    return sendEmailMutation.mutateAsync({
      recipientEmail: email,
      templateType: 'password_reset',
      placeholderData: {
        user_name: userName,
        reset_link: resetLink,
        expiry_minutes: '30'
      }
    });
  };

  const sendVehicleActivationEmail = (email: string, userName: string, vehicleName: string, deviceId: string) => {
    return sendEmailMutation.mutateAsync({
      recipientEmail: email,
      templateType: 'vehicle_activation',
      placeholderData: {
        user_name: userName,
        vehicle_name: vehicleName,
        device_id: deviceId
      }
    });
  };

  return {
    sendEmail: sendEmailMutation.mutateAsync,
    sendOTPEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendVehicleActivationEmail,
    emailLogs,
    refetchEmailLogs,
    isSending: sendEmailMutation.isPending
  };
};
