
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Copy, Info, Shield } from 'lucide-react';

interface ProviderConfig {
  name: string;
  host: string;
  port: number;
  use_ssl: boolean;
  use_tls: boolean;
}

interface SMTPConfigTabProps {
  provider: ProviderConfig;
  copiedText: string;
  onCopyToClipboard: (text: string, label: string) => void;
}

const SMTPConfigTab: React.FC<SMTPConfigTabProps> = ({ 
  provider, 
  copiedText, 
  onCopyToClipboard 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          SMTP Configuration for {provider.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Use these exact settings in the SMTP Configuration form below. 
            Make sure to get your username and password/API key from {provider.name}.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">SMTP Host:</span>
              <div className="flex items-center gap-2">
                <code className="text-sm">{provider.host}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopyToClipboard(provider.host, 'host')}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">SMTP Port:</span>
              <div className="flex items-center gap-2">
                <code className="text-sm">{provider.port}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopyToClipboard(provider.port.toString(), 'port')}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">Use SSL:</span>
              <Badge variant={provider.use_ssl ? 'default' : 'outline'}>
                {provider.use_ssl ? 'Yes' : 'No'}
              </Badge>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">Use TLS:</span>
              <Badge variant={provider.use_tls ? 'default' : 'outline'}>
                {provider.use_tls ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Username:</strong> Get this from your {provider.name} account (usually your API key or email)
                <br />
                <strong>Password:</strong> Your {provider.name} API key or app password
                <br />
                <strong>From Email:</strong> Must be from your verified domain
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {copiedText && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Copied {copiedText} to clipboard!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SMTPConfigTab;
