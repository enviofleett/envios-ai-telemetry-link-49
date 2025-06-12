
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

const NotificationsSettingsTab: React.FC = () => {
  const { 
    preferences, 
    isLoading, 
    isSaving, 
    updatePreference, 
    saveAllPreferences 
  } = useNotificationPreferences();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Configure your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-11" />
                  </div>
                ))}
              </div>
              {i < 2 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Configure how you receive notifications and alerts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Email Notifications</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="text-sm font-normal">General Email Notifications</Label>
              <Switch 
                id="email-notifications" 
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance-reminders" className="text-sm font-normal">Maintenance Reminders</Label>
              <Switch 
                id="maintenance-reminders" 
                checked={preferences.maintenance_reminders}
                onCheckedChange={(checked) => updatePreference('maintenance_reminders', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="system-updates" className="text-sm font-normal">System Updates</Label>
              <Switch 
                id="system-updates" 
                checked={preferences.system_updates}
                onCheckedChange={(checked) => updatePreference('system_updates', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="marketing-emails" className="text-sm font-normal">Marketing Emails</Label>
              <Switch 
                id="marketing-emails" 
                checked={preferences.marketing_emails}
                onCheckedChange={(checked) => updatePreference('marketing_emails', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="weekly-reports" className="text-sm font-normal">Weekly Reports</Label>
              <Switch 
                id="weekly-reports" 
                checked={preferences.weekly_reports}
                onCheckedChange={(checked) => updatePreference('weekly_reports', checked)}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium text-foreground">SMS Notifications</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-notifications" className="text-sm font-normal">General SMS Notifications</Label>
              <Switch 
                id="sms-notifications" 
                checked={preferences.sms_notifications}
                onCheckedChange={(checked) => updatePreference('sms_notifications', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-otp-verification" className="text-sm font-normal">OTP Verification</Label>
              <Switch 
                id="sms-otp-verification" 
                checked={preferences.sms_otp_verification}
                onCheckedChange={(checked) => updatePreference('sms_otp_verification', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-trip-updates" className="text-sm font-normal">Trip Updates</Label>
              <Switch 
                id="sms-trip-updates" 
                checked={preferences.sms_trip_updates}
                onCheckedChange={(checked) => updatePreference('sms_trip_updates', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-maintenance-alerts" className="text-sm font-normal">Maintenance Alerts</Label>
              <Switch 
                id="sms-maintenance-alerts" 
                checked={preferences.sms_maintenance_alerts}
                onCheckedChange={(checked) => updatePreference('sms_maintenance_alerts', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-violation-alerts" className="text-sm font-normal">Violation Alerts</Label>
              <Switch 
                id="sms-violation-alerts" 
                checked={preferences.sms_violation_alerts}
                onCheckedChange={(checked) => updatePreference('sms_violation_alerts', checked)}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="pt-4">
          <Button 
            onClick={saveAllPreferences}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Saving...' : 'Save Notification Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsSettingsTab;
