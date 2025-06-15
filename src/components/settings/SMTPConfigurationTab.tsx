import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Save, TestTube, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SMTPConfig {
  id?: string;
  provider_name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password?: string;
  use_tls: boolean;
  use_ssl: boolean;
  is_active: boolean;
  last_test_status?: 'success' | 'failure' | null;
  last_test_message?: string | null;
  last_tested_at?: string | null;
  from_name: string;
  from_email: string;
}

const SMTP_PROVIDERS = {
  gmail: { name: 'Gmail', host: 'smtp.gmail.com', port: 587, tls: true, ssl: false },
  outlook: { name: 'Outlook', host: 'smtp-mail.outlook.com', port: 587, tls: true, ssl: false },
  yahoo: { name: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 587, tls: true, ssl: false },
  custom: { name: 'Custom SMTP', host: '', port: 587, tls: true, ssl: false },
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
    smtp_password: '',
    use_tls: true,
    use_ssl: false,
    is_active: true,
    from_name: '',
    from_email: '',
  });

  useEffect(() => {
    loadSMTPConfig();
  }, []);

  const loadSMTPConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('smtp_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // The DB has smtp_username and smtp_encryption. We map them to the component's state.
        const providerKey = Object.keys(SMTP_PROVIDERS).find(
          key => SMTP_PROVIDERS[key as keyof typeof SMTP_PROVIDERS].host === data.smtp_host
        ) || 'custom';

        setConfig({
          id: data.id,
          provider_name: providerKey,
          smtp_host: data.smtp_host || '',
          smtp_port: data.smtp_port || 587,
          smtp_user: data.smtp_username || '', // Map from smtp_username
          smtp_password: '', // Always empty for security
          use_tls: data.smtp_encryption === 'tls', // Map from smtp_encryption
          use_ssl: data.smtp_encryption === 'ssl', // Map from smtp_encryption
          is_active: data.is_active === true,
          last_test_status: data.last_test_status as 'success' | 'failure' | null,
          last_test_message: data.last_test_message,
          last_tested_at: data.last_tested_at,
          from_name: data.from_name || '',
          from_email: data.from_email || '',
        });
      }
    } catch (error: any) {
      console.error('Error loading SMTP config:', error);
      toast({ title: "Load Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
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
    // Client-side validation
    if (!config.smtp_host || !config.smtp_port || !config.smtp_user || !config.from_name || !config.from_email) {
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields: SMTP Host, Port, Email/Username, Sender Name, and Sender Email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const configData: any = { ...config };
      if (!configData.smtp_password?.trim()) {
        delete configData.smtp_password;
      }
      
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'save-smtp-settings', ...configData }
      });
      
      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);

      toast({ title: "Configuration Saved", description: "SMTP settings saved successfully." });
      await loadSMTPConfig(); // Reload data from DB to ensure consistency
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    // Client-side validation before saving and testing
    if (!config.smtp_host || !config.smtp_port || !config.smtp_user || !config.from_name || !config.from_email) {
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields before sending a test email.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      // Step 1: Save configuration
      const configData: any = { ...config };
      if (!configData.smtp_password?.trim()) {
        delete configData.smtp_password;
      }
      
      const { data: saveData, error: saveError } = await supabase.functions.invoke('settings-management', {
        body: { action: 'save-smtp-settings', ...configData }
      });
      
      if (saveError) throw new Error(`Save failed: ${saveError.message}`);
      if (!saveData.success) throw new Error(`Save failed: ${saveData.error}`);

      toast({ title: "Configuration Saved", description: "Now sending test email..." });
      
      // Step 2: Test the connection
      const { data: testData, error: testError } = await supabase.functions.invoke('settings-management', {
        body: { action: 'test-smtp-connection' }
      });

      if (testError) throw new Error(testError.message);
      
      if (testData.success) {
        toast({ title: "Test Email Sent", description: "Check your inbox for a confirmation email." });
      } else {
        throw new Error(testData.error || 'Test failed. Please check credentials and server settings.');
      }
    } catch (error: any) {
      toast({ title: "Process Failed", description: error.message, variant: "destructive" });
    } finally {
      await loadSMTPConfig(); // Reload config to get latest test status
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> SMTP Configuration</CardTitle>
        <CardDescription>Configure system-wide SMTP settings for sending emails.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {config.last_test_status === 'failure' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Last Connection Test Failed</AlertTitle>
            <AlertDescription>
              {config.last_test_message || "Unknown error."}
              {config.last_tested_at && ` (Tested at: ${new Date(config.last_tested_at).toLocaleString()})`}
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Email Provider</Label>
            <Select value={config.provider_name} onValueChange={handleProviderChange}>
              <SelectTrigger><SelectValue placeholder="Select email provider" /></SelectTrigger>
              <SelectContent>
                {Object.entries(SMTP_PROVIDERS).map(([key, provider]) => (
                  <SelectItem key={key} value={key}>{provider.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input id="smtp-host" value={config.smtp_host} onChange={(e) => setConfig(prev => ({ ...prev, smtp_host: e.target.value }))} placeholder="smtp.example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input id="smtp-port" type="number" value={config.smtp_port} onChange={(e) => setConfig(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 0 }))} placeholder="587" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-user">Email Address / Username</Label>
            <Input id="smtp-user" type="email" value={config.smtp_user} onChange={(e) => setConfig(prev => ({ ...prev, smtp_user: e.target.value }))} placeholder="your-email@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-pass">Password / App Password</Label>
            <Input id="smtp-pass" type="password" value={config.smtp_password || ''} onChange={(e) => setConfig(prev => ({ ...prev, smtp_password: e.target.value }))} placeholder="Enter new password to update" />
            <p className="text-sm text-muted-foreground">For security, this field is always empty. Enter a new password only if you need to change it.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-name">Sender Name</Label>
              <Input id="from-name" value={config.from_name} onChange={(e) => setConfig(prev => ({ ...prev, from_name: e.target.value }))} placeholder="Your Company Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-email">Sender Email</Label>
              <Input id="from-email" type="email" value={config.from_email} onChange={(e) => setConfig(prev => ({ ...prev, from_email: e.target.value }))} placeholder="noreply@example.com" />
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Switch id="use-tls" checked={config.use_tls} onCheckedChange={(checked) => setConfig(prev => ({ ...prev, use_tls: checked, use_ssl: checked ? false : prev.use_ssl }))} />
              <Label htmlFor="use-tls">Use TLS</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="use-ssl" checked={config.use_ssl} onCheckedChange={(checked) => setConfig(prev => ({ ...prev, use_ssl: checked, use_tls: checked ? false : prev.use_tls }))} />
              <Label htmlFor="use-ssl">Use SSL</Label>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={loading || testing} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
          <Button variant="outline" onClick={handleTestEmail} disabled={testing || loading} className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            {testing ? 'Testing...' : 'Save & Send Test Email'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SMTPConfigurationTab;
