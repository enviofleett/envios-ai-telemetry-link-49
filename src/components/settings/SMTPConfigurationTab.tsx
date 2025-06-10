
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Save, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SMTPConfig {
  id?: string;
  provider_name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass_encrypted: string;
  use_tls: boolean;
  use_ssl: boolean;
  is_active: boolean;
  is_default: boolean;
}

const SMTP_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    tls: true,
    ssl: false,
  },
  outlook: {
    name: 'Outlook',
    host: 'smtp-mail.outlook.com',
    port: 587,
    tls: true,
    ssl: false,
  },
  yahoo: {
    name: 'Yahoo',
    host: 'smtp.mail.yahoo.com',
    port: 587,
    tls: true,
    ssl: false,
  },
  custom: {
    name: 'Custom SMTP',
    host: '',
    port: 587,
    tls: true,
    ssl: false,
  },
};

const SMTPConfigurationTab: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<SMTPConfig>({
    provider_name: 'custom',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass_encrypted: '',
    use_tls: true,
    use_ssl: false,
    is_active: true,
    is_default: true,
  });

  useEffect(() => {
    loadSMTPConfig();
  }, []);

  const loadSMTPConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('smtp_configurations')
        .select('*')
        .eq('is_default', true)
        .single();

      if (data && !error) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading SMTP config:', error);
    }
  };

  const handleProviderChange = (providerName: string) => {
    const provider = SMTP_PROVIDERS[providerName as keyof typeof SMTP_PROVIDERS];
    setConfig(prev => ({
      ...prev,
      provider_name: providerName,
      smtp_host: provider.host,
      smtp_port: provider.port,
      use_tls: provider.tls,
      use_ssl: provider.ssl,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('smtp_configurations')
        .upsert(config, {
          onConflict: 'user_id,provider_name'
        });

      if (error) throw error;

      toast({
        title: "Configuration Saved",
        description: "SMTP configuration has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('smtp-email-service', {
        body: {
          to: user.email,
          subject: 'SMTP Test Email',
          message: 'This is a test email to verify your SMTP configuration is working correctly.',
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Test Email Sent",
        description: "Check your inbox to verify the email was delivered.",
      });
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          SMTP Configuration
        </CardTitle>
        <CardDescription>
          Configure your SMTP settings to send emails from the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Email Provider</Label>
            <Select
              value={config.provider_name}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select email provider" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SMTP_PROVIDERS).map(([key, provider]) => (
                  <SelectItem key={key} value={key}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input
                id="smtp-host"
                value={config.smtp_host}
                onChange={(e) => setConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input
                id="smtp-port"
                type="number"
                value={config.smtp_port}
                onChange={(e) => setConfig(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                placeholder="587"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-user">Email Address</Label>
            <Input
              id="smtp-user"
              type="email"
              value={config.smtp_user}
              onChange={(e) => setConfig(prev => ({ ...prev, smtp_user: e.target.value }))}
              placeholder="your-email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-pass">Password / App Password</Label>
            <Input
              id="smtp-pass"
              type="password"
              value={config.smtp_pass_encrypted}
              onChange={(e) => setConfig(prev => ({ ...prev, smtp_pass_encrypted: e.target.value }))}
              placeholder="Your email password or app-specific password"
            />
            <p className="text-sm text-muted-foreground">
              For Gmail, use an App Password instead of your regular password
            </p>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="use-tls"
                checked={config.use_tls}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, use_tls: checked }))}
              />
              <Label htmlFor="use-tls">Use TLS</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="use-ssl"
                checked={config.use_ssl}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, use_ssl: checked }))}
              />
              <Label htmlFor="use-ssl">Use SSL</Label>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleTestEmail} 
            disabled={testing}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            {testing ? 'Testing...' : 'Send Test Email'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SMTPConfigurationTab;
