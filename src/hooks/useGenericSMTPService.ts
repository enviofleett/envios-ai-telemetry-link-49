
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenericSMTPConfig {
  id?: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  sender_email: string;
  sender_name: string;
  encryption_type: 'none' | 'ssl' | 'tls' | 'starttls';
  is_active: boolean;
}

interface DatabaseSMTPConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password_encrypted: string;
  from_email: string;
  from_name: string;
  use_ssl: boolean;
  use_tls: boolean;
  encryption_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SendEmailParams {
  recipientEmail: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface TestConnectionParams {
  host: string;
  port: number;
  username: string;
  password: string;
  sender_email: string;
  sender_name: string;
  encryption_type: string;
}

// Transform database config to component format
const transformToComponentFormat = (dbConfig: DatabaseSMTPConfig): GenericSMTPConfig => ({
  id: dbConfig.id,
  name: dbConfig.name,
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: '', // Don't expose encrypted password
  sender_email: dbConfig.from_email,
  sender_name: dbConfig.from_name,
  encryption_type: dbConfig.encryption_type as 'none' | 'ssl' | 'tls' | 'starttls',
  is_active: dbConfig.is_active
});

export const useGenericSMTPService = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch SMTP configurations
  const { data: rawSmtpConfigs, isLoading } = useQuery({
    queryKey: ['generic-smtp-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smtp_configurations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DatabaseSMTPConfig[];
    },
  });

  // Transform data for component consumption
  const smtpConfigs = rawSmtpConfigs ? rawSmtpConfigs.map(transformToComponentFormat) : [];

  // Save SMTP configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (config: GenericSMTPConfig) => {
      // Validate configuration
      if (!config.name || !config.host || !config.username || !config.password || 
          !config.sender_email || !config.sender_name) {
        throw new Error('All required fields must be filled');
      }

      // If setting as active, deactivate others first
      if (config.is_active) {
        await supabase
          .from('smtp_configurations')
          .update({ is_active: false })
          .neq('id', config.id || '');
      }

      // Prepare configuration data for database
      const configData = {
        name: config.name,
        host: config.host,
        port: config.port,
        username: config.username,
        password_encrypted: btoa(config.password), // Simple base64 encoding for now
        from_email: config.sender_email,
        from_name: config.sender_name,
        use_ssl: config.encryption_type === 'ssl',
        use_tls: config.encryption_type === 'tls' || config.encryption_type === 'starttls',
        encryption_type: config.encryption_type,
        is_active: config.is_active
      };

      if (config.id) {
        const { data, error } = await supabase
          .from('smtp_configurations')
          .update(configData)
          .eq('id', config.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('smtp_configurations')
          .insert(configData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "SMTP configuration saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['generic-smtp-configurations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save SMTP configuration",
        variant: "destructive"
      });
    }
  });

  // Test SMTP connection
  const testConnectionMutation = useMutation({
    mutationFn: async (config: TestConnectionParams) => {
      const { data, error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          action: 'test-smtp',
          testConfig: config
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Connection test failed');
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Connection Test Successful",
        description: "SMTP configuration is working correctly!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Test Failed",
        description: error.message || "Failed to connect to SMTP server",
        variant: "destructive"
      });
      throw error; // Re-throw to handle in component
    }
  });

  // Send email
  const sendEmailMutation = useMutation({
    mutationFn: async (params: SendEmailParams) => {
      const { data, error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          action: 'send-email',
          recipientEmail: params.recipientEmail,
          subject: params.subject,
          htmlContent: params.htmlContent,
          textContent: params.textContent
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
        description: error.message || "Failed to send email",
        variant: "destructive"
      });
    }
  });

  // Delete configuration
  const deleteConfigMutation = useMutation({
    mutationFn: async (configId: string) => {
      const { error } = await supabase
        .from('smtp_configurations')
        .delete()
        .eq('id', configId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Configuration Deleted",
        description: "SMTP configuration has been removed"
      });
      queryClient.invalidateQueries({ queryKey: ['generic-smtp-configurations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete configuration",
        variant: "destructive"
      });
    }
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ configId, isActive }: { configId: string; isActive: boolean }) => {
      // If activating, deactivate others first
      if (isActive) {
        await supabase
          .from('smtp_configurations')
          .update({ is_active: false })
          .neq('id', configId);
      }

      const { error } = await supabase
        .from('smtp_configurations')
        .update({ is_active: isActive })
        .eq('id', configId);
      
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      toast({
        title: isActive ? "Configuration Activated" : "Configuration Deactivated",
        description: isActive 
          ? "This configuration is now active for sending emails"
          : "Configuration has been deactivated"
      });
      queryClient.invalidateQueries({ queryKey: ['generic-smtp-configurations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update configuration status",
        variant: "destructive"
      });
    }
  });

  return {
    // Data
    smtpConfigs,
    isLoading,
    
    // Actions
    saveConfig: saveConfigMutation.mutateAsync,
    testConnection: testConnectionMutation.mutateAsync,
    sendEmail: sendEmailMutation.mutateAsync,
    deleteConfig: deleteConfigMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
    
    // Loading states
    isSaving: saveConfigMutation.isPending,
    isTesting: testConnectionMutation.isPending,
    isSending: sendEmailMutation.isPending,
    isDeleting: deleteConfigMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
  };
};
