
import React, { useState, useEffect } from 'react';
import { useSecurityContext } from '@/components/security/SecurityProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

interface SecuritySettingsPanelProps {
  refreshToken?: number;
  onRefresh?: () => void;
}

export default function SecuritySettingsPanel({ refreshToken, onRefresh }: SecuritySettingsPanelProps) {
  const { validateInput, checkRateLimit, hasPermission } = useSecurityContext();
  const { toast } = useToast();

  // Demo: Simulate backend storage for settings
  // Replace with Supabase/db fetch in production
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Simulate backend fetch on load/refresh
  useEffect(() => {
    setLoading(true);
    // Simulate fetching real settings here!
    setTimeout(() => {
      setSessionTimeout(60);
      setMaxLoginAttempts(5);
      setTwoFactorEnabled(false);
      setLoading(false);
    }, 400);
  }, [refreshToken]);

  const handleSave = async () => {
    setLoading(true);
    // Here you would push to backend (Supabase) for real!
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Settings Saved",
        description: "Security settings have been updated.",
      });
      if (onRefresh) onRefresh();
    }, 500);
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
            <Switch checked={twoFactorEnabled} disabled={loading} onCheckedChange={setTwoFactorEnabled} />
          </div>
          <div>
            <span className="block font-medium mb-1">Session Timeout (minutes)</span>
            <Input
              type="number"
              value={sessionTimeout}
              min={5}
              max={360}
              step={5}
              disabled={loading}
              onChange={e => setSessionTimeout(parseInt(e.target.value || '0'))}
            />
          </div>
          <Button className="mt-4" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Authentication Settings"}
          </Button>
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
              disabled={loading}
              onChange={e => setMaxLoginAttempts(parseInt(e.target.value || '0'))}
            />
          </div>
          <div>
            <Switch defaultChecked={true} disabled={loading} />
            <span className="ml-2">Enable Audit Logging</span>
          </div>
          <Button className="mt-4" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Rate Limit Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
