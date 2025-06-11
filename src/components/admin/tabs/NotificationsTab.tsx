
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Mail, MessageSquare, Smartphone, Settings, RefreshCw } from 'lucide-react';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';

const NotificationsTab: React.FC = () => {
  const { settings, isLoading, error, updateSettings, isUpdating } = useNotificationSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleChannelToggle = (channelId: string, enabled: boolean) => {
    if (!localSettings) return;
    
    const updatedChannels = localSettings.channels.map(channel =>
      channel.id === channelId ? { ...channel, enabled } : channel
    );
    
    setLocalSettings({
      ...localSettings,
      channels: updatedChannels
    });
  };

  const handleGlobalSettingChange = (key: string, value: string | boolean) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      globalSettings: {
        ...localSettings.globalSettings,
        [key]: value
      }
    });
  };

  const handleNotificationTypeChange = (typeId: string, channel: 'email' | 'sms' | 'push', enabled: boolean) => {
    if (!localSettings) return;
    
    const updatedTypes = localSettings.notificationTypes.map(type =>
      type.id === typeId 
        ? { ...type, channels: { ...type.channels, [channel]: enabled } }
        : type
    );
    
    setLocalSettings({
      ...localSettings,
      notificationTypes: updatedTypes
    });
  };

  const handleSaveSettings = () => {
    if (localSettings) {
      updateSettings(localSettings);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
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
            Error loading notification settings: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!localSettings) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No notification settings available
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
                <Bell className="h-5 w-5" />
                Notification Management
              </CardTitle>
              <CardDescription>
                Configure notification settings and delivery channels
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled={isUpdating} onClick={handleSaveSettings}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Saving...' : 'Save Changes'}
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
                            <Switch 
                              checked={channel.enabled}
                              onCheckedChange={(checked) => handleChannelToggle(channel.id, checked)}
                            />
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
                            <Switch 
                              checked={type.channels.email}
                              onCheckedChange={(checked) => handleNotificationTypeChange(type.id, 'email', checked)}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <Switch 
                              checked={type.channels.sms}
                              onCheckedChange={(checked) => handleNotificationTypeChange(type.id, 'sms', checked)}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            <Switch 
                              checked={type.channels.push}
                              onCheckedChange={(checked) => handleNotificationTypeChange(type.id, 'push', checked)}
                            />
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
                        onChange={(e) => handleGlobalSettingChange('fromName', e.target.value)}
                        placeholder="Sender name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="from-email">From Email</Label>
                      <Input
                        id="from-email"
                        type="email"
                        value={localSettings.globalSettings.fromEmail}
                        onChange={(e) => handleGlobalSettingChange('fromEmail', e.target.value)}
                        placeholder="sender@domain.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reply-to">Reply To Email</Label>
                      <Input
                        id="reply-to"
                        type="email"
                        value={localSettings.globalSettings.replyTo}
                        onChange={(e) => handleGlobalSettingChange('replyTo', e.target.value)}
                        placeholder="support@domain.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sms-sender">SMS Vendor</Label>
                      <Input
                        id="sms-sender"
                        value={localSettings.globalSettings.smsVendor || 'Twilio'}
                        onChange={(e) => handleGlobalSettingChange('smsVendor', e.target.value)}
                        placeholder="SMS Provider"
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
                      <Switch 
                        checked={localSettings.globalSettings.includeUnsubscribe}
                        onCheckedChange={(checked) => handleGlobalSettingChange('includeUnsubscribe', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Track Email Opens</Label>
                        <p className="text-sm text-muted-foreground">
                          Track when emails are opened
                        </p>
                      </div>
                      <Switch 
                        checked={localSettings.globalSettings.trackEmailOpens}
                        onCheckedChange={(checked) => handleGlobalSettingChange('trackEmailOpens', checked)}
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

export default NotificationsTab;
