
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Zap, Mail, User, Car, AlertTriangle, Settings, Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmailTriggers } from '@/hooks/useEmailTriggers';

interface EmailTemplate {
  id: string;
  template_name: string;
  trigger_type: string;
  subject: string;
  is_active: boolean;
  template_type: string;
  variables: string[] | string; // Handle both array and string types from database
}

const EmailTriggersAdminTab: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const {
    isTriggering,
    triggerUserWelcome,
    triggerPasswordReset,
    triggerVehicleOffline,
    triggerMaintenanceReminder,
    triggerSystemNotification
  } = useEmailTriggers();

  const triggerTypes = [
    { value: 'user_registration', label: 'User Registration', icon: User, category: 'User Management' },
    { value: 'password_reset', label: 'Password Reset', icon: User, category: 'User Management' },
    { value: 'vehicle_offline', label: 'Vehicle Offline', icon: Car, category: 'Vehicle Alerts' },
    { value: 'maintenance_due', label: 'Maintenance Due', icon: Car, category: 'Vehicle Alerts' },
    { value: 'geofence_alert', label: 'Geofence Alert', icon: AlertTriangle, category: 'Vehicle Alerts' },
    { value: 'admin_notification', label: 'Admin Notification', icon: Settings, category: 'System' },
    { value: 'system_alert', label: 'System Alert', icon: AlertTriangle, category: 'System' },
    { value: 'bulk_operation', label: 'Bulk Operation', icon: Mail, category: 'System' },
    { value: 'campaign', label: 'Campaign', icon: Mail, category: 'Marketing' }
  ];

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_name');

      if (error) throw error;
      
      // Transform the data to ensure variables is always an array
      const transformedData = (data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) 
          ? template.variables 
          : typeof template.variables === 'string' 
            ? JSON.parse(template.variables || '[]')
            : []
      }));
      
      setTemplates(transformedData);
    } catch (error) {
      console.error('Error loading email templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleToggleTemplate = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: isActive })
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(prev => 
        prev.map(template => 
          template.id === templateId 
            ? { ...template, is_active: isActive }
            : template
        )
      );

      toast({
        title: "Success",
        description: `Template ${isActive ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      console.error('Error toggling template:', error);
      toast({
        title: "Error",
        description: "Failed to update template status",
        variant: "destructive"
      });
    }
  };

  const handleTestTrigger = async (triggerType: string) => {
    const testEmail = 'test@example.com';
    const testName = 'Test User';

    try {
      switch (triggerType) {
        case 'user_registration':
          await triggerUserWelcome(testEmail, testName);
          break;
        case 'password_reset':
          await triggerPasswordReset(testEmail, testName, 'test-token-123');
          break;
        case 'vehicle_offline':
          await triggerVehicleOffline('test-vehicle', 'Test Vehicle', 'DEV001', new Date(), 'Test Location');
          break;
        case 'maintenance_due':
          await triggerMaintenanceReminder('test-vehicle', 'Test Vehicle', 'Oil Change', new Date(), testEmail);
          break;
        default:
          await triggerSystemNotification([testEmail], 'Test Notification', 'This is a test notification', 'info');
      }
    } catch (error) {
      console.error('Error testing trigger:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test email",
        variant: "destructive"
      });
    }
  };

  const groupedTriggers = triggerTypes.reduce((acc, trigger) => {
    if (!acc[trigger.category]) {
      acc[trigger.category] = [];
    }
    acc[trigger.category].push(trigger);
    return acc;
  }, {} as Record<string, typeof triggerTypes>);

  const getTemplateForTrigger = (triggerType: string) => {
    return templates.find(template => template.trigger_type === triggerType);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Email Triggers Management
          </CardTitle>
          <CardDescription>
            Configure and manage automated email triggers for various system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="triggers" className="space-y-4">
            <TabsList>
              <TabsTrigger value="triggers">Available Triggers</TabsTrigger>
              <TabsTrigger value="templates">Template Management</TabsTrigger>
              <TabsTrigger value="testing">Test Triggers</TabsTrigger>
            </TabsList>

            <TabsContent value="triggers" className="space-y-6">
              {Object.entries(groupedTriggers).map(([category, triggers]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-lg font-medium">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {triggers.map((trigger) => {
                      const template = getTemplateForTrigger(trigger.value);
                      const Icon = trigger.icon;
                      
                      return (
                        <Card key={trigger.value} className="relative">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <h4 className="font-medium">{trigger.label}</h4>
                                  <p className="text-sm text-muted-foreground">{trigger.value}</p>
                                </div>
                              </div>
                              {template && (
                                <Switch
                                  checked={template.is_active}
                                  onCheckedChange={(checked) => handleToggleTemplate(template.id, checked)}
                                />
                              )}
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              {template ? (
                                <Badge variant={template.is_active ? "default" : "secondary"}>
                                  {template.is_active ? "Active" : "Inactive"}
                                </Badge>
                              ) : (
                                <Badge variant="outline">No Template</Badge>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTestTrigger(trigger.value)}
                                disabled={isTriggering || !template}
                              >
                                Test
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  <Separator />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Templates</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {templates.map((template) => (
                      <Card 
                        key={template.id} 
                        className={`cursor-pointer transition-colors ${selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{template.template_name}</h4>
                              <p className="text-sm text-muted-foreground">{template.trigger_type}</p>
                            </div>
                            <Badge variant={template.is_active ? "default" : "secondary"}>
                              {template.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {selectedTemplate && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Template Details</h3>
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <Label>Template Name</Label>
                          <p className="text-sm">{selectedTemplate.template_name}</p>
                        </div>
                        <div>
                          <Label>Trigger Type</Label>
                          <p className="text-sm">{selectedTemplate.trigger_type}</p>
                        </div>
                        <div>
                          <Label>Subject</Label>
                          <p className="text-sm">{selectedTemplate.subject}</p>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Badge variant={selectedTemplate.is_active ? "default" : "secondary"}>
                            {selectedTemplate.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div>
                          <Label>Available Variables</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(selectedTemplate.variables as string[]).map((variable: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">User Management Triggers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => handleTestTrigger('user_registration')} 
                      disabled={isTriggering}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Test Welcome Email
                    </Button>
                    <Button 
                      onClick={() => handleTestTrigger('password_reset')} 
                      disabled={isTriggering}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Test Password Reset
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Vehicle Alerts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => handleTestTrigger('vehicle_offline')} 
                      disabled={isTriggering}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Car className="h-4 w-4 mr-2" />
                      Test Vehicle Offline
                    </Button>
                    <Button 
                      onClick={() => handleTestTrigger('maintenance_due')} 
                      disabled={isTriggering}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Car className="h-4 w-4 mr-2" />
                      Test Maintenance Due
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTriggersAdminTab;
