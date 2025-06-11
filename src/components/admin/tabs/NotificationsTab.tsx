
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Mail, MessageSquare, Smartphone, Settings, RefreshCw } from 'lucide-react';

const NotificationsTab: React.FC = () => {
  const [isLoading] = useState(false);

  // Placeholder settings - will be replaced with actual notification service
  const [localSettings] = useState({
    channels: [
      {
        id: 'email',
        name: 'Email',
        type: 'email' as const,
        enabled: true,
        description: 'Send notifications via email'
      },
      {
        id: 'sms',
        name: 'SMS',
        type: 'sms' as const,
        enabled: false,
        description: 'Send notifications via SMS'
      },
      {
        id: 'push',
        name: 'Push Notifications',
        type: 'push' as const,
        enabled: true,
        description: 'Send browser push notifications'
      }
    ],
    globalSettings: {
      fromName: 'FleetIQ System',
      fromEmail: 'noreply@fleetiq.com',
      replyTo: 'support@fleetiq.com',
      smsVendor: 'Twilio',
      trackEmailOpens: true,
      includeUnsubscribe: true
    },
    notificationTypes: [
      {
        id: 'vehicle_alerts',
        name: 'Vehicle Alerts',
        description: 'Alerts for vehicle issues and maintenance',
        channels: { email: true, sms: false, push: true }
      },
      {
        id: 'user_actions',
        name: 'User Actions',
        description: 'Notifications for user registrations and updates',
        channels: { email: true, sms: false, push: false }
      },
      {
        id: 'system_events',
        name: 'System Events',
        description: 'System maintenance and updates',
        channels: { email: true, sms: true, push: true }
      },
      {
        id: 'billing',
        name: 'Billing',
        description: 'Payment and subscription notifications',
        channels: { email: true, sms: false, push: false }
      }
    ]
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Management
              </CardTitle>
              <CardDescription>
                Configure notification settings and delivery channels (Service temporarily unavailable)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Save Changes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="channels" className="space-y-4">
            <TabsList>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="types">Notification Types</TabsTrigger>
              <TabsTrigger value="templates">Global Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="channels" className="space-y-4">
              <div className="grid gap-4">
                {localSettings.channels.map((channel) => {
                  const IconComponent = channel.type === 'email' ? Mail : 
                                       channel.type === 'sms' ? MessageSquare : Smartphone;
                  return (
                    <Card key={channel.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-5 w-5" />
                            <div>
                              <h3 className="font-medium">{channel.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {channel.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={channel.enabled ? 'default' : 'secondary'}>
                              {channel.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                            <Switch checked={channel.enabled} disabled />
                            <Button variant="outline" size="sm" disabled>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="types" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Types</h3>
                {localSettings.notificationTypes.map((type) => (
                  <Card key={type.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{type.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {type.description}
                          </p>
                        </div>
                        <div className="flex gap-6">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <Switch checked={type.channels.email} disabled />
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <Switch checked={type.channels.sms} disabled />
                          </div>
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            <Switch checked={type.channels.push} disabled />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Global Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from-name">From Name</Label>
                      <Input
                        id="from-name"
                        value={localSettings.globalSettings.fromName}
                        disabled
                        placeholder="Sender name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="from-email">From Email</Label>
                      <Input
                        id="from-email"
                        type="email"
                        value={localSettings.globalSettings.fromEmail}
                        disabled
                        placeholder="sender@domain.com"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Notification settings will be available once the service is restored.</p>
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

export default NotificationsTab;
