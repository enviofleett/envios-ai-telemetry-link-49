
import React, { useState } from 'react';
import { useSecurityContext } from '@/components/security/SecurityProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

export default function SecuritySettingsPanel() {
  const { validateInput, checkRateLimit, hasPermission } = useSecurityContext();
  const { toast } = useToast();

  // Example: local settings for session timeout/rate limiting
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // TODO: Connect to actual configuration if available. Demo state for now.

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Security settings have been updated.",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex gap-2">
            <Lock className="h-4 w-4" /> Authentication Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="block font-medium">Two-Factor Authentication</span>
              <span className="text-sm text-muted-foreground">Require 2FA for all admin accounts</span>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
          </div>
          <div>
            <span className="block font-medium mb-1">Session Timeout (minutes)</span>
            <Input
              type="number"
              value={sessionTimeout}
              min={5}
              max={360}
              step={5}
              onChange={e => setSessionTimeout(parseInt(e.target.value || '0'))}
            />
          </div>
          <Button className="mt-4" onClick={handleSave}>Save Authentication Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex gap-2">
            <Lock className="h-4 w-4" /> Rate Limiting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="block font-medium mb-1">Max Login Attempts</span>
            <Input
              type="number"
              value={maxLoginAttempts}
              min={1}
              max={20}
              step={1}
              onChange={e => setMaxLoginAttempts(parseInt(e.target.value || '0'))}
            />
          </div>
          <div>
            <Switch defaultChecked={true} />
            <span className="ml-2">Enable Audit Logging</span>
          </div>
          <Button className="mt-4" onClick={handleSave}>Save Rate Limit Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
