
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Copy, Globe, Info } from 'lucide-react';

interface DNSRecords {
  spf: string;
  dkim: string;
  dmarc: string;
}

interface DNSConfigTabProps {
  providerName: string;
  dnsRecords: DNSRecords;
  onCopyToClipboard: (text: string, label: string) => void;
}

const DNSConfigTab: React.FC<DNSConfigTabProps> = ({ 
  providerName, 
  dnsRecords, 
  onCopyToClipboard 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          DNS Configuration for {providerName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Add these DNS records to your domain to improve email deliverability and prevent emails from being marked as spam.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">SPF Record</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopyToClipboard(dnsRecords.spf, 'SPF record')}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <p className="text-xs text-gray-600 mb-2">Type: TXT | Name: @ | Value:</p>
            <code className="text-xs bg-gray-100 p-2 rounded block">
              {dnsRecords.spf}
            </code>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">DKIM Record</h4>
              <Badge variant="outline">Auto-configured</Badge>
            </div>
            <p className="text-xs text-gray-600 mb-2">{dnsRecords.dkim}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">DMARC Record</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopyToClipboard(dnsRecords.dmarc, 'DMARC record')}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <p className="text-xs text-gray-600 mb-2">Type: TXT | Name: _dmarc | Value:</p>
            <code className="text-xs bg-gray-100 p-2 rounded block">
              {dnsRecords.dmarc}
            </code>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            DNS changes can take up to 48 hours to propagate. You can verify your DNS records using online tools like MXToolbox or dig commands.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default DNSConfigTab;
