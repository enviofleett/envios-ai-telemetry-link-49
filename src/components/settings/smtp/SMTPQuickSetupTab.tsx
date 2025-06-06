
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Save, Eye, EyeOff } from 'lucide-react';

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

interface SMTPQuickSetupTabProps {
  smtpForm: SMTPConfig;
  setSMTPForm: React.Dispatch<React.SetStateAction<SMTPConfig>>;
  selectedProvider: string;
  setSelectedProvider: React.Dispatch<React.SetStateAction<string>>;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  onProviderSelect: (provider: string) => void;
}

const SMTPQuickSetupTab: React.FC<SMTPQuickSetupTabProps> = ({
  smtpForm,
  setSMTPForm,
  selectedProvider,
  showPassword,
  setShowPassword,
  onSave,
  onReset,
  isSaving,
  onProviderSelect
}) => {
  return (
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
          <Select value={selectedProvider} onValueChange={onProviderSelect}>
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
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
          <Button
            variant="outline"
            onClick={onReset}
          >
            Reset Form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SMTPQuickSetupTab;
