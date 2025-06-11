
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Key, AlertTriangle, Eye, Lock, RefreshCw } from 'lucide-react';

const SecurityTab: React.FC = () => {
  // Placeholder data - will be replaced with actual security service
  const placeholderEvents = [
    {
      id: '1',
      type: 'login',
      user: 'admin@fleetiq.com',
      timestamp: new Date().toISOString(),
      ip: '192.168.1.100',
      status: 'success'
    },
    {
      id: '2',
      type: 'failed_login',
      user: 'unknown@suspicious.com',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      ip: '203.0.113.42',
      status: 'blocked'
    }
  ];

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
                Manage security settings and monitor security events (Service temporarily unavailable)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled>
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
                      <Switch id="two-factor" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                      <Input
                        id="session-timeout"
                        type="number"
                        value="60"
                        disabled
                        placeholder="60"
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
                        value="5"
                        disabled
                        placeholder="5"
                      />
                    </div>
                    <div className="pt-4">
                      <Button disabled>
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
                <Button variant="outline" disabled>
                  <Eye className="h-4 w-4 mr-2" />
                  View All Events
                </Button>
              </div>
              
              <div className="space-y-4">
                {placeholderEvents.map((event) => (
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
                          </div>
                        </div>
                        {getStatusBadge(event.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center py-4 text-muted-foreground">
                <p>Security monitoring will be available once the service is restored.</p>
              </div>
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
                      <Switch defaultChecked disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>API Access Control</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable API key authentication
                        </p>
                      </div>
                      <Switch defaultChecked disabled />
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
