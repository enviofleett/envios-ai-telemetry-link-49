
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Mail, MessageSquare, Smartphone, Settings } from 'lucide-react';

const NotificationsTab: React.FC = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const notificationChannels = [
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      enabled: true,
      description: 'Send notifications via email'
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: MessageSquare,
      enabled: false,
      description: 'Send notifications via SMS'
    },
    {
      id: 'push',
      name: 'Push Notifications',
      icon: Smartphone,
      enabled: true,
      description: 'Send browser push notifications'
    }
  ];

  const notificationTypes = [
    {
      id: 'vehicle_alerts',
      name: 'Vehicle Alerts',
      description: 'Alerts for vehicle issues and maintenance',
      email: true,
      sms: false,
      push: true
    },
    {
      id: 'user_actions',
      name: 'User Actions',
      description: 'Notifications for user registrations and updates',
      email: true,
      sms: false,
      push: false
    },
    {
      id: 'system_events',
      name: 'System Events',
      description: 'System maintenance and updates',
      email: true,
      sms: true,
      push: true
    },
    {
      id: 'billing',
      name: 'Billing',
      description: 'Payment and subscription notifications',
      email: true,
      sms: false,
      push: false
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Management
          </CardTitle>
          <CardDescription>
            Configure notification settings and delivery channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="channels" className="space-y-4">
            <TabsList>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="types">Notification Types</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="channels" className="space-y-4">
              <div className="grid gap-4">
                {notificationChannels.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <Card key={channel.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
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
                            <Switch defaultChecked={channel.enabled} />
                            <Button variant="outline" size="sm">
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
                {notificationTypes.map((type) => (
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
                            <Switch defaultChecked={type.email} />
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <Switch defaultChecked={type.sms} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            <Switch defaultChecked={type.push} />
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
                        defaultValue="FleetIQ System"
                        placeholder="Sender name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="from-email">From Email</Label>
                      <Input
                        id="from-email"
                        type="email"
                        defaultValue="noreply@fleetiq.com"
                        placeholder="sender@domain.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reply-to">Reply To Email</Label>
                      <Input
                        id="reply-to"
                        type="email"
                        defaultValue="support@fleetiq.com"
                        placeholder="support@domain.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sms-sender">SMS Sender ID</Label>
                      <Input
                        id="sms-sender"
                        defaultValue="FleetIQ"
                        placeholder="Sender ID"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Include Unsubscribe Link</Label>
                        <p className="text-sm text-muted-foreground">
                          Add unsubscribe link to all emails
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Track Email Opens</Label>
                        <p className="text-sm text-muted-foreground">
                          Track when emails are opened
                        </p>
                      </div>
                      <Switch defaultChecked />
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

export default NotificationsTab;
