
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
          <CardTitle>Fleet Alerts & Notifications</CardTitle>
          <CardDescription>Configure real-time alerts and notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-11" />
                  </div>
                ))}
              </div>
              {i < 3 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Alerts & Notifications</CardTitle>
        <CardDescription>Configure real-time alerts and notification preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Vehicle Status Alerts</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="vehicle-online" className="text-sm font-normal">Vehicle Online/Offline</Label>
              <Switch 
                id="vehicle-online" 
                checked={preferences.vehicle_online_offline}
                onCheckedChange={(checked) => updatePreference('vehicle_online_offline', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="low-battery" className="text-sm font-normal">Low Battery Alerts</Label>
              <Switch 
                id="low-battery" 
                checked={preferences.low_battery_alerts}
                onCheckedChange={(checked) => updatePreference('low_battery_alerts', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance-due" className="text-sm font-normal">Maintenance Due</Label>
              <Switch 
                id="maintenance-due" 
                checked={preferences.maintenance_due}
                onCheckedChange={(checked) => updatePreference('maintenance_due', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="engine-diagnostics" className="text-sm font-normal">Engine Diagnostics</Label>
              <Switch 
                id="engine-diagnostics" 
                checked={preferences.engine_diagnostics}
                onCheckedChange={(checked) => updatePreference('engine_diagnostics', checked)}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Geofence & Security</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="geofence-violations" className="text-sm font-normal">Geofence Violations</Label>
              <Switch 
                id="geofence-violations" 
                checked={preferences.geofence_violations}
                onCheckedChange={(checked) => updatePreference('geofence_violations', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="speeding-alerts" className="text-sm font-normal">Speeding Alerts</Label>
              <Switch 
                id="speeding-alerts" 
                checked={preferences.speeding_alerts}
                onCheckedChange={(checked) => updatePreference('speeding_alerts', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="unauthorized-use" className="text-sm font-normal">Unauthorized Use</Label>
              <Switch 
                id="unauthorized-use" 
                checked={preferences.unauthorized_use}
                onCheckedChange={(checked) => updatePreference('unauthorized_use', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="panic-button" className="text-sm font-normal">Panic Button Alerts</Label>
              <Switch 
                id="panic-button" 
                checked={preferences.panic_button}
                onCheckedChange={(checked) => updatePreference('panic_button', checked)}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium text-foreground">System Notifications</h4>
          <div className="space-y-3">
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
              <Label htmlFor="daily-reports" className="text-sm font-normal">Daily Fleet Reports</Label>
              <Switch 
                id="daily-reports" 
                checked={preferences.daily_reports}
                onCheckedChange={(checked) => updatePreference('daily_reports', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="billing-alerts" className="text-sm font-normal">Billing Alerts</Label>
              <Switch 
                id="billing-alerts" 
                checked={preferences.billing_alerts}
                onCheckedChange={(checked) => updatePreference('billing_alerts', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="api-status" className="text-sm font-normal">API Status Updates</Label>
              <Switch 
                id="api-status" 
                checked={preferences.api_status}
                onCheckedChange={(checked) => updatePreference('api_status', checked)}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Delivery Methods</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="text-sm font-normal">Email Notifications</Label>
              <Switch 
                id="email-notifications" 
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-notifications" className="text-sm font-normal">SMS Notifications</Label>
              <Switch 
                id="sms-notifications" 
                checked={preferences.sms_notifications}
                onCheckedChange={(checked) => updatePreference('sms_notifications', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="text-sm font-normal">Push Notifications</Label>
              <Switch 
                id="push-notifications" 
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="webhook-notifications" className="text-sm font-normal">Webhook Notifications</Label>
              <Switch 
                id="webhook-notifications" 
                checked={preferences.webhook_notifications}
                onCheckedChange={(checked) => updatePreference('webhook_notifications', checked)}
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
            {isSaving ? 'Saving...' : 'Save All Notification Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsSettingsTab;
