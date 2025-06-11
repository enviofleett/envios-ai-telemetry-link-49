
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Key, AlertTriangle, Eye, Lock, RefreshCw } from 'lucide-react';
import { useSecurityData } from '@/hooks/useSecurityData';
import { toast } from 'sonner';

const SecurityTab: React.FC = () => {
  const { events, settings, isLoading, error, refetch } = useSecurityData();
  const [localSettings, setLocalSettings] = useState(settings);

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <Key className="h-4 w-4 text-green-600" />;
      case 'failed_login':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'password_change':
        return <Lock className="h-4 w-4 text-blue-600" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default">{status}</Badge>;
      case 'blocked':
      case 'failed':
        return <Badge variant="destructive">{status}</Badge>;
      case 'warning':
        return <Badge variant="secondary">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSettingChange = (key: string, value: boolean | number) => {
    if (localSettings) {
      setLocalSettings({ ...localSettings, [key]: value });
    }
  };

  const handleSaveSettings = () => {
    // TODO: Implement actual save functionality
    toast.success('Security settings saved successfully');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading security data: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Management
              </CardTitle>
              <CardDescription>
                Manage security settings and monitor security events
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="settings" className="space-y-4">
            <TabsList>
              <TabsTrigger value="settings">Security Settings</TabsTrigger>
              <TabsTrigger value="events">Security Events</TabsTrigger>
              <TabsTrigger value="policies">Access Policies</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Authentication Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Require 2FA for all admin accounts
                        </p>
                      </div>
                      <Switch
                        id="two-factor"
                        checked={localSettings?.twoFactorEnabled || false}
                        onCheckedChange={(checked) => handleSettingChange('twoFactorEnabled', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                      <Input
                        id="session-timeout"
                        type="number"
                        value={localSettings?.sessionTimeout || 60}
                        onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                        placeholder="60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-policy">Minimum Password Length</Label>
                      <Input
                        id="password-policy"
                        type="number"
                        value={localSettings?.passwordMinLength || 8}
                        onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                        placeholder="8"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Access Control</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-attempts">Max Login Attempts</Label>
                      <Input
                        id="max-attempts"
                        type="number"
                        value={localSettings?.maxLoginAttempts || 5}
                        onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                        placeholder="5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
                      <Input
                        id="lockout-duration"
                        type="number"
                        value={localSettings?.lockoutDuration || 15}
                        onChange={(e) => handleSettingChange('lockoutDuration', parseInt(e.target.value))}
                        placeholder="15"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>IP Whitelist</Label>
                        <p className="text-sm text-muted-foreground">
                          Restrict access to specific IP addresses
                        </p>
                      </div>
                      <Switch 
                        checked={localSettings?.ipWhitelistEnabled || false}
                        onCheckedChange={(checked) => handleSettingChange('ipWhitelistEnabled', checked)}
                      />
                    </div>
                    <div className="pt-4">
                      <Button onClick={handleSaveSettings}>
                        Save Security Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Recent Security Events</h3>
                <Button variant="outline" onClick={() => refetch()}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All Events
                </Button>
              </div>
              
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getEventIcon(event.type)}
                          <div>
                            <div className="font-medium capitalize">
                              {event.type.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              User: {event.user} | IP: {event.ip}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                            {event.details && (
                              <div className="text-xs text-red-600 mt-1">
                                {event.details}
                              </div>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(event.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {events.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No security events found
                </div>
              )}
            </TabsContent>

            <TabsContent value="policies" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Access Policies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Admin Panel Access</Label>
                        <p className="text-sm text-muted-foreground">
                          Restrict admin panel to admin users only
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>API Access Control</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable API key authentication
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Audit Logging</Label>
                        <p className="text-sm text-muted-foreground">
                          Log all administrative actions
                        </p>
                      </div>
                      <Switch 
                        checked={localSettings?.auditLoggingEnabled || false}
                        onCheckedChange={(checked) => handleSettingChange('auditLoggingEnabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Data Encryption</Label>
                        <p className="text-sm text-muted-foreground">
                          Encrypt sensitive data at rest
                        </p>
                      </div>
                      <Switch 
                        checked={localSettings?.dataEncryptionEnabled || false}
                        onCheckedChange={(checked) => handleSettingChange('dataEncryptionEnabled', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityTab;
