
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TestTube, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

interface SMTPAdvancedConfigTabProps {
  smtpForm: SMTPConfig;
  setSMTPForm: React.Dispatch<React.SetStateAction<SMTPConfig>>;
  testingConnection: boolean;
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  onTestConnection: () => void;
}

const SMTPAdvancedConfigTab: React.FC<SMTPAdvancedConfigTabProps> = ({
  smtpForm,
  setSMTPForm,
  testingConnection,
  connectionStatus,
  onTestConnection
}) => {
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
            onClick={onTestConnection}
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
  );
};

export default SMTPAdvancedConfigTab;
