import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Mail, 
  TestTube, 
  Save, 
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

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

const providerTemplates = {
  gmail: {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    use_ssl: false,
    use_tls: true
  },
  outlook: {
    name: 'Outlook/Hotmail',
    host: 'smtp-mail.outlook.com',
    port: 587,
    use_ssl: false,
    use_tls: true
  },
  sendgrid: {
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    use_ssl: false,
    use_tls: true
  },
  mailgun: {
    name: 'Mailgun',
    host: 'smtp.mailgun.org',
    port: 587,
    use_ssl: false,
    use_tls: true
  }
};

const EnhancedSMTPSettingsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
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

  const testSMTPConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('testing');
    
    try {
      const { data, error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          action: 'test-smtp',
          testConfig: {
            host: smtpForm.host,
            port: smtpForm.port,
            username: smtpForm.username,
            password: smtpForm.password_encrypted,
            from_email: smtpForm.from_email,
            from_name: smtpForm.from_name,
            use_ssl: smtpForm.use_ssl,
            use_tls: smtpForm.use_tls
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        setConnectionStatus('success');
        toast({
          title: "Success",
          description: "SMTP connection test successful!"
        });
      } else {
        setConnectionStatus('error');
        throw new Error(data.error);
      }
    } catch (error: any) {
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
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
          templateType: 'welcome',
          placeholderData: {
            user_name: 'Test User'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: `Test email sent successfully to ${testEmail}`
      });
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

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">SMTP Email Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure SMTP settings for reliable email delivery across your Envio platform
        </p>
      </div>

      <Tabs defaultValue="quick-setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick-setup">Quick Setup</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Config</TabsTrigger>
          <TabsTrigger value="test">Test & Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Quick SMTP Setup
              </CardTitle>
              <CardDescription>
                Choose a provider template or configure manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider-template">Email Provider Template</Label>
                <Select value={selectedProvider} onValueChange={handleProviderSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="outlook">Outlook/Hotmail</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Configuration Name</Label>
                  <Input
                    id="name"
                    value={smtpForm.name}
                    onChange={(e) => setSMTPForm(prev => ({...prev, name: e.target.value}))}
                    placeholder="e.g., Primary Email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_name">Sender Name</Label>
                  <Input
                    id="from_name"
                    value={smtpForm.from_name}
                    onChange={(e) => setSMTPForm(prev => ({...prev, from_name: e.target.value}))}
                    placeholder="Envio Platform"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Email Address</Label>
                  <Input
                    id="username"
                    type="email"
                    value={smtpForm.username}
                    onChange={(e) => setSMTPForm(prev => ({
                      ...prev, 
                      username: e.target.value,
                      from_email: e.target.value
                    }))}
                    placeholder="your-email@domain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">App Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={smtpForm.password_encrypted}
                      onChange={(e) => setSMTPForm(prev => ({...prev, password_encrypted: e.target.value}))}
                      placeholder="Enter app password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={smtpForm.is_active}
                  onCheckedChange={(checked) => setSMTPForm(prev => ({...prev, is_active: checked}))}
                />
                <Label htmlFor="is_active">Set as active configuration</Label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={() => saveSMTPMutation.mutate(smtpForm)}
                  disabled={saveSMTPMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveSMTPMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                >
                  Reset Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced SMTP Configuration</CardTitle>
              <CardDescription>
                Detailed server settings and encryption options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">SMTP Host</Label>
                  <Input
                    id="host"
                    value={smtpForm.host}
                    onChange={(e) => setSMTPForm(prev => ({...prev, host: e.target.value}))}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={smtpForm.port}
                    onChange={(e) => setSMTPForm(prev => ({...prev, port: parseInt(e.target.value)}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Connection Status</Label>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    {getConnectionStatusIcon()}
                    <span className="text-sm">
                      {connectionStatus === 'testing' && 'Testing connection...'}
                      {connectionStatus === 'success' && 'Connection successful'}
                      {connectionStatus === 'error' && 'Connection failed'}
                      {connectionStatus === 'idle' && 'Not tested'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use_ssl"
                    checked={smtpForm.use_ssl}
                    onCheckedChange={(checked) => setSMTPForm(prev => ({...prev, use_ssl: checked}))}
                  />
                  <Label htmlFor="use_ssl">Use SSL (Port 465)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use_tls"
                    checked={smtpForm.use_tls}
                    onCheckedChange={(checked) => setSMTPForm(prev => ({...prev, use_tls: checked}))}
                  />
                  <Label htmlFor="use_tls">Use TLS/STARTTLS (Port 587)</Label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={testSMTPConnection}
                  variant="outline"
                  disabled={testingConnection || !smtpForm.host}
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Configurations */}
          {smtpConfigs && smtpConfigs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Existing Configurations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {smtpConfigs.map((config: any) => (
                    <div key={config.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{config.name}</h4>
                          {config.is_active && <Badge variant="default">Active</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{config.host}:{config.port}</p>
                        <p className="text-sm text-muted-foreground">{config.from_email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadSMTPConfig(config)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Email Delivery</CardTitle>
              <CardDescription>
                Send a test email to verify your SMTP configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Test Recipient Email</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <Button
                onClick={sendTestEmail}
                disabled={!testEmail || !smtpConfigs?.some(c => c.is_active)}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Send Test Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedSMTPSettingsTab;
