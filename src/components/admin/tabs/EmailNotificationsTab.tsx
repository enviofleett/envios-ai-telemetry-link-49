
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MailOpen, Bell, Users, Wrench, CreditCard, Shield } from 'lucide-react';

const EmailNotificationsTab: React.FC = () => {
  const [settings, setSettings] = useState({
    userNotifications: {
      welcome: true,
      passwordReset: true,
      accountUpdates: false,
      newsletter: true
    },
    adminNotifications: {
      newRegistrations: true,
      systemAlerts: true,
      maintenanceReminders: true,
      billingUpdates: true,
      securityAlerts: true
    },
    workshopNotifications: {
      appointmentConfirmations: true,
      maintenanceCompleted: true,
      paymentReceived: false
    },
    emailSettings: {
      fromName: 'FleetIQ System',
      fromEmail: 'noreply@fleetiq.com',
      replyTo: 'support@fleetiq.com'
    }
  });

  const updateSetting = (category: string, key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailOpen className="h-5 w-5" />
            Email Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure email notifications for users, admins, and workshops
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global Email Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Global Email Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={settings.emailSettings.fromName}
                  onChange={(e) => updateSetting('emailSettings', 'fromName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={settings.emailSettings.fromEmail}
                  onChange={(e) => updateSetting('emailSettings', 'fromEmail', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="replyTo">Reply To</Label>
                <Input
                  id="replyTo"
                  type="email"
                  value={settings.emailSettings.replyTo}
                  onChange={(e) => updateSetting('emailSettings', 'replyTo', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* User Notifications */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" />
              <h3 className="text-lg font-medium">User Notifications</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="welcome">Welcome Email</Label>
                  <p className="text-sm text-muted-foreground">Send welcome email to new users</p>
                </div>
                <Switch
                  id="welcome"
                  checked={settings.userNotifications.welcome}
                  onCheckedChange={(checked) => updateSetting('userNotifications', 'welcome', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="passwordReset">Password Reset</Label>
                  <p className="text-sm text-muted-foreground">Password reset confirmation emails</p>
                </div>
                <Switch
                  id="passwordReset"
                  checked={settings.userNotifications.passwordReset}
                  onCheckedChange={(checked) => updateSetting('userNotifications', 'passwordReset', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="accountUpdates">Account Updates</Label>
                  <p className="text-sm text-muted-foreground">Account changes and updates</p>
                </div>
                <Switch
                  id="accountUpdates"
                  checked={settings.userNotifications.accountUpdates}
                  onCheckedChange={(checked) => updateSetting('userNotifications', 'accountUpdates', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newsletter">Newsletter</Label>
                  <p className="text-sm text-muted-foreground">Monthly newsletter and updates</p>
                </div>
                <Switch
                  id="newsletter"
                  checked={settings.userNotifications.newsletter}
                  onCheckedChange={(checked) => updateSetting('userNotifications', 'newsletter', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Admin Notifications */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5" />
              <h3 className="text-lg font-medium">Admin Notifications</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newRegistrations">New Registrations</Label>
                  <p className="text-sm text-muted-foreground">Notify when new users register</p>
                </div>
                <Switch
                  id="newRegistrations"
                  checked={settings.adminNotifications.newRegistrations}
                  onCheckedChange={(checked) => updateSetting('adminNotifications', 'newRegistrations', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="systemAlerts">System Alerts</Label>
                  <p className="text-sm text-muted-foreground">Critical system notifications</p>
                </div>
                <Switch
                  id="systemAlerts"
                  checked={settings.adminNotifications.systemAlerts}
                  onCheckedChange={(checked) => updateSetting('adminNotifications', 'systemAlerts', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceReminders">Maintenance Reminders</Label>
                  <p className="text-sm text-muted-foreground">Vehicle maintenance due alerts</p>
                </div>
                <Switch
                  id="maintenanceReminders"
                  checked={settings.adminNotifications.maintenanceReminders}
                  onCheckedChange={(checked) => updateSetting('adminNotifications', 'maintenanceReminders', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="billingUpdates">Billing Updates</Label>
                  <p className="text-sm text-muted-foreground">Payment and billing notifications</p>
                </div>
                <Switch
                  id="billingUpdates"
                  checked={settings.adminNotifications.billingUpdates}
                  onCheckedChange={(checked) => updateSetting('adminNotifications', 'billingUpdates', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="securityAlerts">Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">Security-related notifications</p>
                </div>
                <Switch
                  id="securityAlerts"
                  checked={settings.adminNotifications.securityAlerts}
                  onCheckedChange={(checked) => updateSetting('adminNotifications', 'securityAlerts', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Workshop Notifications */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5" />
              <h3 className="text-lg font-medium">Workshop Notifications</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="appointmentConfirmations">Appointment Confirmations</Label>
                  <p className="text-sm text-muted-foreground">Maintenance appointment confirmations</p>
                </div>
                <Switch
                  id="appointmentConfirmations"
                  checked={settings.workshopNotifications.appointmentConfirmations}
                  onCheckedChange={(checked) => updateSetting('workshopNotifications', 'appointmentConfirmations', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceCompleted">Maintenance Completed</Label>
                  <p className="text-sm text-muted-foreground">Service completion notifications</p>
                </div>
                <Switch
                  id="maintenanceCompleted"
                  checked={settings.workshopNotifications.maintenanceCompleted}
                  onCheckedChange={(checked) => updateSetting('workshopNotifications', 'maintenanceCompleted', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="paymentReceived">Payment Received</Label>
                  <p className="text-sm text-muted-foreground">Payment confirmation emails</p>
                </div>
                <Switch
                  id="paymentReceived"
                  checked={settings.workshopNotifications.paymentReceived}
                  onCheckedChange={(checked) => updateSetting('workshopNotifications', 'paymentReceived', checked)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button>Save Notification Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailNotificationsTab;
