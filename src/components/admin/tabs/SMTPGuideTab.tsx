
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Mail, Shield, Key } from 'lucide-react';

const SMTPGuideTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            SMTP Setup Guide
          </CardTitle>
          <CardDescription>
            Step-by-step guide to configure SMTP for popular email providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Most email providers require app-specific passwords instead of your regular account password for SMTP authentication.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gmail Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Enable 2-Factor Authentication</h4>
            <p className="text-sm text-muted-foreground">
              Go to your Google Account settings and enable 2-factor authentication if not already enabled.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">2. Generate App Password</h4>
            <p className="text-sm text-muted-foreground">
              Go to Google Account → Security → App passwords and generate a new app password for "Mail".
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">3. SMTP Settings</h4>
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <p className="text-sm"><strong>Host:</strong> smtp.gmail.com</p>
              <p className="text-sm"><strong>Port:</strong> 587</p>
              <p className="text-sm"><strong>Security:</strong> TLS enabled</p>
              <p className="text-sm"><strong>Username:</strong> your-email@gmail.com</p>
              <p className="text-sm"><strong>Password:</strong> Use the generated app password</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Outlook/Hotmail Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Enable 2-Factor Authentication</h4>
            <p className="text-sm text-muted-foreground">
              Enable 2FA in your Microsoft account security settings.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">2. Generate App Password</h4>
            <p className="text-sm text-muted-foreground">
              Go to Microsoft Account → Security → App passwords and create a new app password.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">3. SMTP Settings</h4>
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <p className="text-sm"><strong>Host:</strong> smtp-mail.outlook.com</p>
              <p className="text-sm"><strong>Port:</strong> 587</p>
              <p className="text-sm"><strong>Security:</strong> TLS enabled</p>
              <p className="text-sm"><strong>Username:</strong> your-email@outlook.com</p>
              <p className="text-sm"><strong>Password:</strong> Use the generated app password</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Yahoo Mail Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Enable 2-Factor Authentication</h4>
            <p className="text-sm text-muted-foreground">
              Enable 2FA in your Yahoo account security settings.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">2. Generate App Password</h4>
            <p className="text-sm text-muted-foreground">
              Go to Yahoo Account → Security → App passwords and generate a password for "Other app".
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">3. SMTP Settings</h4>
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <p className="text-sm"><strong>Host:</strong> smtp.mail.yahoo.com</p>
              <p className="text-sm"><strong>Port:</strong> 587</p>
              <p className="text-sm"><strong>Security:</strong> TLS enabled</p>
              <p className="text-sm"><strong>Username:</strong> your-email@yahoo.com</p>
              <p className="text-sm"><strong>Password:</strong> Use the generated app password</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Password Security</h4>
            <p className="text-sm text-muted-foreground">
              Always use app-specific passwords instead of your main account password. This provides better security and prevents issues with 2FA.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Connection Security</h4>
            <p className="text-sm text-muted-foreground">
              Always use TLS encryption when available. This ensures your email content and credentials are encrypted in transit.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Testing</h4>
            <p className="text-sm text-muted-foreground">
              Use the "Send Test Email" button after configuration to verify everything is working correctly before sending important emails.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMTPGuideTab;
