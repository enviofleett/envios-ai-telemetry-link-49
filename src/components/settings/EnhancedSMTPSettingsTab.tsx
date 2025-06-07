
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProductionSMTPService } from '@/hooks/useProductionSMTPService';
import SMTPQuickSetupTab from './smtp/SMTPQuickSetupTab';
import SMTPAdvancedConfigTab from './smtp/SMTPAdvancedConfigTab';
import SMTPTestTab from './smtp/SMTPTestTab';
import SMTPConfigurationList from './smtp/SMTPConfigurationList';
import SMTPMonitoringTab from './smtp/SMTPMonitoringTab';
import { providerTemplates } from './smtp/smtpProviderTemplates';

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

const EnhancedSMTPSettingsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    testSMTPConnection, 
    validateSMTPConfig,
    isTesting 
  } = useProductionSMTPService();
  
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testEmail, setTestEmail] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  const [smtpForm, setSMTPForm] = useState<SMTPConfig>({
    name: '',
    host: '',
    port: 587,
    username: '',
    password_encrypted: '',
    from_email: '',
    from_name: '',
    use_ssl: false,
    use_tls: true,
    is_active: false
  });

  // Fetch SMTP configurations
  const { data: smtpConfigs, isLoading: smtpLoading } = useQuery({
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

  // Save SMTP configuration
  const saveSMTPMutation = useMutation({
    mutationFn: async (config: SMTPConfig) => {
      // Validate configuration before saving
      const validationErrors = validateSMTPConfig(config);
      if (validationErrors.length > 0) {
        throw new Error(`Configuration errors: ${validationErrors.join(', ')}`);
      }

      const encryptedPassword = btoa(config.password_encrypted);
      
      const dataToSave = {
        ...config,
        password_encrypted: encryptedPassword
      };

      if (config.id) {
        const { data, error } = await supabase
          .from('smtp_configurations')
          .update(dataToSave)
          .eq('id', config.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('smtp_configurations')
          .insert(dataToSave)
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
      queryClient.invalidateQueries({ queryKey: ['smtp-configurations'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSMTPForm({
      name: '',
      host: '',
      port: 587,
      username: '',
      password_encrypted: '',
      from_email: '',
      from_name: '',
      use_ssl: false,
      use_tls: true,
      is_active: false
    });
    setSelectedProvider('');
  };

  const handleProviderSelect = (provider: string) => {
    if (provider && providerTemplates[provider as keyof typeof providerTemplates]) {
      const template = providerTemplates[provider as keyof typeof providerTemplates];
      setSMTPForm(prev => ({
        ...prev,
        name: template.name,
        host: template.host,
        port: template.port,
        use_ssl: template.use_ssl,
        use_tls: template.use_tls
      }));
      setSelectedProvider(provider);
    }
  };

  const testSMTPConnectionEnhanced = async () => {
    setConnectionStatus('testing');
    
    try {
      const testConfig = {
        host: smtpForm.host,
        port: smtpForm.port,
        username: smtpForm.username,
        password: smtpForm.password_encrypted,
        from_email: smtpForm.from_email,
        from_name: smtpForm.from_name,
        use_ssl: smtpForm.use_ssl,
        use_tls: smtpForm.use_tls
      };

      await testSMTPConnection(testConfig);
      setConnectionStatus('success');
    } catch (error: any) {
      setConnectionStatus('error');
      // Error toast is handled by the hook
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          action: 'send-email',
          recipientEmail: testEmail,
          templateType: 'test',
          placeholderData: {
            user_name: 'Test User'
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Test Email Sent",
          description: `Test email sent successfully to ${testEmail}`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Failed to Send Test Email",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadSMTPConfig = (config: any) => {
    setSMTPForm({
      ...config,
      password_encrypted: ''
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Production SMTP Email Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure production-ready SMTP settings with enhanced security and monitoring
        </p>
      </div>

      <Tabs defaultValue="quick-setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quick-setup">Quick Setup</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Config</TabsTrigger>
          <TabsTrigger value="test">Test & Monitor</TabsTrigger>
          <TabsTrigger value="monitoring">Activity Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-setup" className="space-y-4">
          <SMTPQuickSetupTab
            smtpForm={smtpForm}
            setSMTPForm={setSMTPForm}
            selectedProvider={selectedProvider}
            setSelectedProvider={setSelectedProvider}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onSave={() => saveSMTPMutation.mutate(smtpForm)}
            onReset={resetForm}
            isSaving={saveSMTPMutation.isPending}
            onProviderSelect={handleProviderSelect}
          />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <SMTPAdvancedConfigTab
            smtpForm={smtpForm}
            setSMTPForm={setSMTPForm}
            testingConnection={isTesting}
            connectionStatus={connectionStatus}
            onTestConnection={testSMTPConnectionEnhanced}
          />

          <SMTPConfigurationList
            smtpConfigs={smtpConfigs || []}
            onLoadConfig={loadSMTPConfig}
          />
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <SMTPTestTab
            testEmail={testEmail}
            setTestEmail={setTestEmail}
            onSendTestEmail={sendTestEmail}
            hasActiveConfig={smtpConfigs?.some(c => c.is_active) || false}
          />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <SMTPMonitoringTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedSMTPSettingsTab;
