
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Save, Eye, EyeOff, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

interface GenericSMTPFormProps {
  onSave: (config: GenericSMTPConfig) => void;
  onTest: (config: GenericSMTPConfig) => Promise<boolean>;
  isSaving: boolean;
  isTesting: boolean;
}

const GenericSMTPForm: React.FC<GenericSMTPFormProps> = ({
  onSave,
  onTest,
  isSaving,
  isTesting
}) => {
  const [config, setConfig] = useState<GenericSMTPConfig>({
    name: '',
    host: '',
    port: 587,
    username: '',
    password: '',
    sender_email: '',
    sender_name: '',
    encryption_type: 'starttls',
    is_active: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleFieldChange = (field: keyof GenericSMTPConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestStatus('idle'); // Reset test status when config changes
  };

  const handleTest = async () => {
    try {
      setTestStatus('idle');
      const success = await onTest(config);
      if (success) {
        setTestStatus('success');
        setTestMessage('SMTP connection test successful!');
      } else {
        setTestStatus('error');
        setTestMessage('SMTP connection test failed. Please check your configuration.');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : 'Connection test failed');
    }
  };

  const handleSave = () => {
    onSave(config);
  };

  const getPortForEncryption = (encryptionType: string) => {
    switch (encryptionType) {
      case 'ssl': return 465;
      case 'tls':
      case 'starttls': return 587;
      case 'none': return 25;
      default: return 587;
    }
  };

  const handleEncryptionChange = (encryptionType: string) => {
    const newPort = getPortForEncryption(encryptionType);
    setConfig(prev => ({
      ...prev,
      encryption_type: encryptionType as GenericSMTPConfig['encryption_type'],
      port: newPort
    }));
  };

  const isFormValid = config.name && config.host && config.username && 
                     config.password && config.sender_email && config.sender_name;

  const getTestIcon = () => {
    if (isTesting) return <TestTube className="h-4 w-4 animate-pulse" />;
    if (testStatus === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (testStatus === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    return <TestTube className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Generic SMTP Configuration
        </CardTitle>
        <CardDescription>
          Configure any 3rd-party SMTP provider for reliable email delivery
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Name */}
        <div className="space-y-2">
          <Label htmlFor="config-name">Configuration Name</Label>
          <Input
            id="config-name"
            value={config.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="e.g., Production Email Server"
          />
        </div>

        {/* SMTP Server Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP Host</Label>
            <Input
              id="smtp-host"
              value={config.host}
              onChange={(e) => handleFieldChange('host', e.target.value)}
              placeholder="e.g., smtp.example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-port">SMTP Port</Label>
            <Input
              id="smtp-port"
              type="number"
              value={config.port}
              onChange={(e) => handleFieldChange('port', parseInt(e.target.value))}
              placeholder="587"
            />
          </div>
        </div>

        {/* Encryption Type */}
        <div className="space-y-2">
          <Label htmlFor="encryption-type">Encryption Type</Label>
          <Select value={config.encryption_type} onValueChange={handleEncryptionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select encryption type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="starttls">STARTTLS (Recommended)</SelectItem>
              <SelectItem value="tls">TLS/SSL</SelectItem>
              <SelectItem value="ssl">SSL</SelectItem>
              <SelectItem value="none">None (Not Recommended)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Authentication */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="email"
              value={config.username}
              onChange={(e) => handleFieldChange('username', e.target.value)}
              placeholder="your-email@provider.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={config.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                placeholder="Your SMTP password or app password"
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

        {/* Sender Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sender-email">Sender Email Address</Label>
            <Input
              id="sender-email"
              type="email"
              value={config.sender_email}
              onChange={(e) => handleFieldChange('sender_email', e.target.value)}
              placeholder="noreply@yourcompany.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sender-name">Sender Name</Label>
            <Input
              id="sender-name"
              value={config.sender_name}
              onChange={(e) => handleFieldChange('sender_name', e.target.value)}
              placeholder="Your Company Name"
            />
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center space-x-2">
          <Switch
            id="is-active"
            checked={config.is_active}
            onCheckedChange={(checked) => handleFieldChange('is_active', checked)}
          />
          <Label htmlFor="is-active">Set as active configuration</Label>
        </div>

        {/* Test Status */}
        {testStatus !== 'idle' && (
          <Alert className={testStatus === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{testMessage}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            onClick={handleTest}
            variant="outline"
            disabled={!isFormValid || isTesting}
            className="flex items-center gap-2"
          >
            {getTestIcon()}
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GenericSMTPForm;
