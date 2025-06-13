
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, XCircle, AlertTriangle, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SMTPSettings {
  id?: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;
  is_active: boolean;
  from_name: string;
  from_email: string;
}

interface SMTPRecord {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;
  is_active: boolean;
  from_name: string;
  from_email: string;
  created_at: string;
  updated_at: string;
}

const SMTPConfigurationTab: React.FC = () => {
  const [settings, setSettings] = useState<SMTPSettings>({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    is_active: false,
    from_name: '',
    from_email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{status: string, message: string} | null>(null);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('smtp_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const record = data as SMTPRecord;
        setSettings({
          id: record.id,
          smtp_host: record.smtp_host || '',
          smtp_port: record.smtp_port || 587,
          smtp_username: record.smtp_username || '',
          smtp_password: record.smtp_password || '',
          smtp_encryption: record.smtp_encryption || 'tls',
          is_active: record.is_active || false,
          from_name: record.from_name || '',
          from_email: record.from_email || ''
        });
      }
    } catch (error) {
      console.error('Error loading SMTP settings:', error);
      toast({
        title: "Error",
        description: "Failed to load SMTP settings",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const settingsData = {
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        smtp_username: settings.smtp_username,
        smtp_password: settings.smtp_password,
        smtp_encryption: settings.smtp_encryption,
        is_active: settings.is_active,
        from_name: settings.from_name,
        from_email: settings.from_email
      };

      if (settings.id) {
        const { error } = await supabase
          .from('smtp_settings')
          .update(settingsData)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('smtp_settings')
          .insert(settingsData)
          .select()
          .single();
        if (error) throw error;
        setSettings(prev => ({ ...prev, id: (data as SMTPRecord).id }));
      }

      toast({
        title: "Success",
        description: "SMTP settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      toast({
        title: "Error",
        description: "Failed to save SMTP settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          to: settings.from_email,
          subject: 'SMTP Test Email',
          message: 'This is a test email to verify your SMTP configuration.',
          trigger_type: 'smtp_test'
        }
      });

      if (error) {
        setTestResult({
          status: 'error',
          message: error.message || 'Failed to send test email'
        });
      } else {
        setTestResult({
          status: 'success',
          message: 'Test email sent successfully!'
        });
      }
    } catch (error) {
      setTestResult({
        status: 'error',
        message: 'Failed to test SMTP connection'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const commonProviders = [
    { name: 'Gmail', host: 'smtp.gmail.com', port: 587, encryption: 'tls' },
    { name: 'Outlook', host: 'smtp-mail.outlook.com', port: 587, encryption: 'tls' },
    { name: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 587, encryption: 'tls' },
    { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, encryption: 'tls' },
    { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587, encryption: 'tls' }
  ];

  const handleProviderSelect = (provider: typeof commonProviders[0]) => {
    setSettings(prev => ({
      ...prev,
      smtp_host: provider.host,
      smtp_port: provider.port,
      smtp_encryption: provider.encryption
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>
            Configure your SMTP server settings for sending emails from the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="settings" className="space-y-4">
            <TabsList>
              <TabsTrigger value="settings">SMTP Settings</TabsTrigger>
              <TabsTrigger value="providers">Quick Setup</TabsTrigger>
              <TabsTrigger value="test">Test Connection</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={settings.smtp_host}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">Username</Label>
                  <Input
                    id="smtp_username"
                    value={settings.smtp_username}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtp_username: e.target.value }))}
                    placeholder="your-email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={settings.smtp_password}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                    placeholder="Your SMTP password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_encryption">Encryption</Label>
                  <Select value={settings.smtp_encryption} onValueChange={(value) => setSettings(prev => ({ ...prev, smtp_encryption: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_name">From Name</Label>
                  <Input
                    id="from_name"
                    value={settings.from_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, from_name: e.target.value }))}
                    placeholder="FleetIQ System"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_email">From Email</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={settings.from_email}
                    onChange={(e) => setSettings(prev => ({ ...prev, from_email: e.target.value }))}
                    placeholder="noreply@example.com"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.is_active}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Enable SMTP Configuration</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="providers" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {commonProviders.map((provider) => (
                  <Card key={provider.name} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleProviderSelect(provider)}>
                    <CardContent className="p-4">
                      <h4 className="font-medium">{provider.name}</h4>
                      <p className="text-sm text-muted-foreground">{provider.host}:{provider.port}</p>
                      <Badge variant="outline" className="mt-2">{provider.encryption.toUpperCase()}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Make sure to save your SMTP settings before testing the connection.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleTestConnection} 
                disabled={isTesting || !settings.smtp_host || !settings.from_email}
                className="w-full"
              >
                {isTesting ? 'Testing Connection...' : 'Send Test Email'}
              </Button>

              {testResult && (
                <Alert variant={testResult.status === 'success' ? 'default' : 'destructive'}>
                  {testResult.status === 'success' ? 
                    <CheckCircle className="h-4 w-4" /> : 
                    <XCircle className="h-4 w-4" />
                  }
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMTPConfigurationTab;
