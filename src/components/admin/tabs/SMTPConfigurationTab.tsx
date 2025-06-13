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
import { Mail, CheckCircle, XCircle, AlertTriangle, Settings, Info } from 'lucide-react';
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
  const [testResult, setTestResult] = useState<{status: string, message: string, details?: any} | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
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

  const validateSettings = (): string[] => {
    const errors: string[] = [];

    if (!settings.smtp_host) {
      errors.push('SMTP Host is required');
    } else if (!settings.smtp_host.includes('.')) {
      errors.push('SMTP Host should be a proper hostname (e.g., smtp.gmail.com)');
    } else if (settings.smtp_host.startsWith('http://') || settings.smtp_host.startsWith('https://')) {
      errors.push('SMTP Host should not include http:// or https://');
    }

    if (!settings.smtp_username) {
      errors.push('SMTP Username is required');
    } else if (!settings.smtp_username.includes('@')) {
      errors.push('SMTP Username should be an email address');
    }

    if (!settings.smtp_password) {
      errors.push('SMTP Password is required');
    }

    if (!settings.from_email) {
      errors.push('From Email is required');
    } else if (!settings.from_email.includes('@')) {
      errors.push('From Email should be a valid email address');
    }

    if (settings.smtp_port < 1 || settings.smtp_port > 65535) {
      errors.push('SMTP Port must be between 1 and 65535');
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validateSettings();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before saving",
        variant: "destructive"
      });
      return;
    }

    setValidationErrors([]);
    setIsLoading(true);
    
    try {
      const settingsData = {
        smtp_host: settings.smtp_host.trim(),
        smtp_port: settings.smtp_port,
        smtp_username: settings.smtp_username.trim(),
        smtp_password: settings.smtp_password,
        smtp_encryption: settings.smtp_encryption,
        is_active: settings.is_active,
        from_name: settings.from_name.trim(),
        from_email: settings.from_email.trim()
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
    const errors = validateSettings();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before testing",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setValidationErrors([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          to: settings.from_email,
          subject: 'SMTP Test Email - FleetIQ',
          message: `This is a test email to verify your SMTP configuration.\n\nConfiguration tested:\n- Host: ${settings.smtp_host}\n- Port: ${settings.smtp_port}\n- Encryption: ${settings.smtp_encryption}\n- Username: ${settings.smtp_username}\n\nIf you received this email, your SMTP configuration is working correctly!`,
          trigger_type: 'smtp_test'
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        setTestResult({
          status: 'error',
          message: 'Edge function error',
          details: error.message || 'Failed to call email service'
        });
      } else if (data.success) {
        setTestResult({
          status: 'success',
          message: `Test email sent successfully to ${settings.from_email}!`,
          details: data
        });
        toast({
          title: "Test Successful",
          description: `Test email sent to ${settings.from_email}`,
        });
      } else {
        setTestResult({
          status: 'error',
          message: data.error || 'Failed to send test email',
          details: data
        });
        toast({
          title: "Test Failed",
          description: data.error || "Failed to send test email",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setTestResult({
        status: 'error',
        message: 'Failed to test SMTP connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      toast({
        title: "Test Error",
        description: "Failed to test SMTP connection",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const commonProviders = [
    { name: 'Gmail', host: 'smtp.gmail.com', port: 587, encryption: 'tls', note: 'Use App Password, not regular password' },
    { name: 'Outlook/Office365', host: 'smtp.office365.com', port: 587, encryption: 'tls', note: 'Modern authentication supported' },
    { name: 'Yahoo Mail', host: 'smtp.mail.yahoo.com', port: 587, encryption: 'tls', note: 'App password required' },
    { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, encryption: 'tls', note: 'Use API key as password' },
    { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587, encryption: 'tls', note: 'Use Mailgun credentials' }
  ];

  const handleProviderSelect = (provider: typeof commonProviders[0]) => {
    setSettings(prev => ({
      ...prev,
      smtp_host: provider.host,
      smtp_port: provider.port,
      smtp_encryption: provider.encryption
    }));
    setValidationErrors([]);
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
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Please fix these validation errors:</div>
                <ul className="list-disc list-inside mt-2">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="settings" className="space-y-4">
            <TabsList>
              <TabsTrigger value="settings">SMTP Settings</TabsTrigger>
              <TabsTrigger value="providers">Quick Setup</TabsTrigger>
              <TabsTrigger value="test">Test Connection</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> SMTP Host should be the actual mail server (e.g., smtp.gmail.com), 
                  not your website domain. Username should be your email address.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={settings.smtp_host}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                    placeholder="smtp.gmail.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mail server hostname (not your website domain)
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    587 for TLS, 465 for SSL
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">Username (Email)</Label>
                  <Input
                    id="smtp_username"
                    type="email"
                    value={settings.smtp_username}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtp_username: e.target.value }))}
                    placeholder="your-email@example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your email address used for authentication
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={settings.smtp_password}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                    placeholder="Your SMTP password or app password"
                  />
                  <p className="text-xs text-muted-foreground">
                    For Gmail, use App Password instead of regular password
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_encryption">Encryption</Label>
                  <Select value={settings.smtp_encryption} onValueChange={(value) => setSettings(prev => ({ ...prev, smtp_encryption: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS (Port 587)</SelectItem>
                      <SelectItem value="ssl">SSL (Port 465)</SelectItem>
                      <SelectItem value="none">None (Not recommended)</SelectItem>
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
                      <p className="text-xs text-muted-foreground mt-2">{provider.note}</p>
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
                  The test will send an email to your "From Email" address.
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
                  <AlertDescription>
                    <div className="font-medium">{testResult.message}</div>
                    {testResult.details && testResult.details.troubleshooting && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Troubleshooting suggestions:</p>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {testResult.details.troubleshooting.suggestions?.map((suggestion: string, index: number) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {testResult.details && testResult.details.details && (
                      <div className="mt-2 text-sm">
                        <strong>Error details:</strong> {testResult.details.details}
                      </div>
                    )}
                  </AlertDescription>
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
