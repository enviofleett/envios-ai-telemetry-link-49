
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SMTPConfig {
  id?: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password_encrypted: string;
  from_email: string;
  from_name: string;
  use_ssl: boolean;
  use_tls: boolean;
  is_active: boolean;
}

interface SendEmailParams {
  recipientEmail: string;
  templateType: 'otp' | 'welcome' | 'password_reset' | 'vehicle_activation' | 'test';
  placeholderData?: Record<string, string>;
  smtpConfigId?: string;
}

interface TestSMTPParams {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  use_ssl: boolean;
  use_tls: boolean;
}

export const useProductionSMTPService = () => {
  const { toast } = useToast();

  const sendEmailMutation = useMutation({
    mutationFn: async (params: SendEmailParams) => {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(params.recipientEmail)) {
        throw new Error('Invalid email address format');
      }

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
    onSuccess: (data) => {
      toast({
        title: "Email Sent",
        description: data.message || "Email has been sent successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email",
        variant: "destructive"
      });
    }
  });

  const testSMTPMutation = useMutation({
    mutationFn: async (testConfig: TestSMTPParams) => {
      // Validate configuration before sending
      const errors = validateSMTPConfig(testConfig);
      if (errors.length > 0) {
        throw new Error(`Configuration errors: ${errors.join(', ')}`);
      }

      const { data, error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          action: 'test-smtp',
          testConfig
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "SMTP Test Successful",
          description: "Your SMTP configuration is working correctly!"
        });
      } else {
        toast({
          title: "SMTP Test Failed",
          description: data.error || "SMTP connection test failed",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "SMTP Test Failed",
        description: error.message || "Connection test failed",
        variant: "destructive"
      });
    }
  });

  const validateConfigMutation = useMutation({
    mutationFn: async (smtpConfigId: string) => {
      const { data, error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          action: 'validate-config',
          smtpConfigId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Configuration Valid",
          description: "SMTP configuration is valid and ready to use"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Configuration Invalid",
        description: error.message || "Configuration validation failed",
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
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const { data: smtpConfigs, refetch: refetchConfigs } = useQuery({
    queryKey: ['smtp-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smtp_configurations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Helper function for configuration validation
  const validateSMTPConfig = (config: Partial<TestSMTPParams>): string[] => {
    const errors: string[] = [];
    
    if (!config.host || config.host.length < 3) {
      errors.push('SMTP host is required and must be valid');
    }
    
    if (!config.port || config.port < 1 || config.port > 65535) {
      errors.push('Port must be between 1 and 65535');
    }
    
    if (!config.username || config.username.length < 1) {
      errors.push('Username is required');
    }
    
    if (!config.password || config.password.length < 1) {
      errors.push('Password is required');
    }
    
    if (!config.from_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.from_email)) {
      errors.push('Valid from email address is required');
    }
    
    if (!config.from_name || config.from_name.length < 1) {
      errors.push('From name is required');
    }
    
    return errors;
  };

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

  const testSMTPConnection = (config: TestSMTPParams) => {
    return testSMTPMutation.mutateAsync(config);
  };

  const validateConfiguration = (configId: string) => {
    return validateConfigMutation.mutateAsync(configId);
  };

  return {
    // Core functions
    sendEmail: sendEmailMutation.mutateAsync,
    testSMTPConnection,
    validateConfiguration,
    
    // Helper functions
    sendOTPEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendVehicleActivationEmail,
    validateSMTPConfig,
    
    // Data and state
    emailLogs,
    smtpConfigs,
    refetchEmailLogs,
    refetchConfigs,
    
    // Loading states
    isSending: sendEmailMutation.isPending,
    isTesting: testSMTPMutation.isPending,
    isValidating: validateConfigMutation.isPending,
    
    // Mutation objects for additional control
    sendEmailMutation,
    testSMTPMutation,
    validateConfigMutation
  };
};
