
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Mail, 
  Settings, 
  TestTube, 
  Save, 
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Palette,
  FileText
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

interface EmailTemplate {
  id: string;
  template_type: string;
  subject: string;
  body_html: string;
  theme: string;
  placeholders: string[];
  is_active: boolean;
}

const SMTPSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const [smtpForm, setSMTPForm] = useState<SMTPConfig>({
    name: '',
    host: '',
    port: 587,
    username: '',
    password_encrypted: '',
    from_email: '',
    from_name: '',
    use_ssl: true,
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

  // Fetch email templates
  const { data: emailTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_type');
      
      if (error) throw error;
      // Convert placeholders from Json to string[]
      return data?.map(template => ({
        ...template,
        placeholders: Array.isArray(template.placeholders) 
          ? template.placeholders 
          : JSON.parse(template.placeholders as string || '[]')
      })) as EmailTemplate[];
    }
  });

  // Save SMTP configuration
  const saveSMTPMutation = useMutation({
    mutationFn: async (config: SMTPConfig) => {
      const encryptedPassword = btoa(config.password_encrypted); // Simple base64 encoding
      
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
      setSMTPForm({
        name: '',
        host: '',
        port: 587,
        username: '',
        password_encrypted: '',
        from_email: '',
        from_name: '',
        use_ssl: true,
        use_tls: true,
        is_active: false
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Test SMTP connection
  const testSMTPConnection = async () => {
    setTestingConnection(true);
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
        toast({
          title: "Success",
          description: "SMTP connection test successful!"
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Update email template
  const updateTemplateMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update({
          subject: template.subject,
          body_html: template.body_html,
          theme: template.theme
        })
        .eq('id', template.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email template updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const loadSMTPConfig = (config: any) => {
    setSMTPForm({
      ...config,
      password_encrypted: '' // Don't show encrypted password
    });
  };

  const getTemplateTypeLabel = (type: string) => {
    switch (type) {
      case 'otp': return 'OTP Verification';
      case 'welcome': return 'Welcome Email';
      case 'password_reset': return 'Password Reset';
      case 'vehicle_activation': return 'Vehicle Activation';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">SMTP Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure SMTP settings for sending emails and customize email templates
        </p>
      </div>

      <Tabs defaultValue="smtp-config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="smtp-config" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            SMTP Config
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Themes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp-config" className="space-y-4">
          {/* Existing SMTP Configurations */}
          {smtpConfigs && smtpConfigs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Existing SMTP Configurations
                </CardTitle>
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
                        <p className="text-sm text-gray-600">{config.host}:{config.port}</p>
                        <p className="text-sm text-gray-600">{config.from_email}</p>
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

          {/* SMTP Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {smtpForm.id ? 'Edit SMTP Configuration' : 'Add SMTP Configuration'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Configuration Name</Label>
                  <Input
                    id="name"
                    value={smtpForm.name}
                    onChange={(e) => setSMTPForm(prev => ({...prev, name: e.target.value}))}
                    placeholder="e.g., Primary SMTP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="host">SMTP Host</Label>
                  <Input
                    id="host"
                    value={smtpForm.host}
                    onChange={(e) => setSMTPForm(prev => ({...prev, host: e.target.value}))}
                    placeholder="smtp.gmail.com"
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
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={smtpForm.username}
                    onChange={(e) => setSMTPForm(prev => ({...prev, username: e.target.value}))}
                    placeholder="your-email@domain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={smtpForm.password_encrypted}
                      onChange={(e) => setSMTPForm(prev => ({...prev, password_encrypted: e.target.value}))}
                      placeholder="Enter password"
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
                <div className="space-y-2">
                  <Label htmlFor="from_email">From Email</Label>
                  <Input
                    id="from_email"
                    value={smtpForm.from_email}
                    onChange={(e) => setSMTPForm(prev => ({...prev, from_email: e.target.value}))}
                    placeholder="noreply@yourdomain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_name">From Name</Label>
                  <Input
                    id="from_name"
                    value={smtpForm.from_name}
                    onChange={(e) => setSMTPForm(prev => ({...prev, from_name: e.target.value}))}
                    placeholder="Envio Platform"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use_ssl"
                    checked={smtpForm.use_ssl}
                    onCheckedChange={(checked) => setSMTPForm(prev => ({...prev, use_ssl: checked}))}
                  />
                  <Label htmlFor="use_ssl">Use SSL</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use_tls"
                    checked={smtpForm.use_tls}
                    onCheckedChange={(checked) => setSMTPForm(prev => ({...prev, use_tls: checked}))}
                  />
                  <Label htmlFor="use_tls">Use TLS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={smtpForm.is_active}
                    onCheckedChange={(checked) => setSMTPForm(prev => ({...prev, is_active: checked}))}
                  />
                  <Label htmlFor="is_active">Set as Active</Label>
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
                <Button
                  onClick={() => saveSMTPMutation.mutate(smtpForm)}
                  disabled={saveSMTPMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveSMTPMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emailTemplates?.map((template: EmailTemplate) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{getTemplateTypeLabel(template.template_type)}</h4>
                      <Badge variant="outline">{template.theme}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.subject}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.placeholders.map((placeholder: string) => (
                        <Badge key={placeholder} variant="secondary" className="text-xs">
                          {placeholder}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplate(template)}
                      className="w-full"
                    >
                      Edit Template
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Editor Modal */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Edit {getTemplateTypeLabel(selectedTemplate.template_type)} Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-subject">Subject</Label>
                  <Input
                    id="template-subject"
                    value={selectedTemplate.subject}
                    onChange={(e) => setSelectedTemplate(prev => prev ? {...prev, subject: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-theme">Theme</Label>
                  <Select
                    value={selectedTemplate.theme}
                    onValueChange={(value) => setSelectedTemplate(prev => prev ? {...prev, theme: value} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-body">Email Body (HTML)</Label>
                  <Textarea
                    id="template-body"
                    value={selectedTemplate.body_html}
                    onChange={(e) => setSelectedTemplate(prev => prev ? {...prev, body_html: e.target.value} : null)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Available Placeholders</Label>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.placeholders.map((placeholder: string) => (
                      <Badge key={placeholder} variant="secondary">
                        {`{{${placeholder}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    onClick={() => updateTemplateMutation.mutate(selectedTemplate)}
                    disabled={updateTemplateMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="themes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Themes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Light Theme</h4>
                  <div className="bg-white border rounded p-3 mb-3" style={{fontSize: '12px'}}>
                    <div style={{color: '#333', fontFamily: 'Arial, sans-serif'}}>
                      <h3 style={{color: '#0066cc'}}>Sample Email</h3>
                      <p>Hello Sample User,</p>
                      <p>This is a sample email using the light theme.</p>
                    </div>
                  </div>
                  <Badge variant="outline">Default</Badge>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Dark Theme</h4>
                  <div className="bg-gray-900 border rounded p-3 mb-3" style={{fontSize: '12px'}}>
                    <div style={{color: '#fff', fontFamily: 'Arial, sans-serif'}}>
                      <h3 style={{color: '#60a5fa'}}>Sample Email</h3>
                      <p>Hello Sample User,</p>
                      <p>This is a sample email using the dark theme.</p>
                    </div>
                  </div>
                  <Badge variant="outline">Professional</Badge>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Minimal Theme</h4>
                  <div className="bg-gray-50 border rounded p-3 mb-3" style={{fontSize: '12px'}}>
                    <div style={{color: '#374151', fontFamily: 'system-ui, sans-serif'}}>
                      <h3 style={{color: '#111827'}}>Sample Email</h3>
                      <p>Hello Sample User,</p>
                      <p>This is a sample email using the minimal theme.</p>
                    </div>
                  </div>
                  <Badge variant="outline">Clean</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SMTPSettings;
