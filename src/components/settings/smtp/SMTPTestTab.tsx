
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';

interface SMTPTestTabProps {
  testEmail: string;
  setTestEmail: React.Dispatch<React.SetStateAction<string>>;
  onSendTestEmail: () => void;
  hasActiveConfig: boolean;
}

const SMTPTestTab: React.FC<SMTPTestTabProps> = ({
  testEmail,
  setTestEmail,
  onSendTestEmail,
  hasActiveConfig
}) => {
  return (
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
          onClick={onSendTestEmail}
          disabled={!testEmail || !hasActiveConfig}
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Send Test Email
        </Button>
      </CardContent>
    </Card>
  );
};

export default SMTPTestTab;
