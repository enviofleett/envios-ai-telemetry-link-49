
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const NotificationsSettingsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Alerts & Notifications</CardTitle>
        <CardDescription>Configure real-time alerts and notification preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <h4 className="font-medium">Vehicle Status Alerts</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vehicle-online">Vehicle Online/Offline</Label>
              <Switch id="vehicle-online" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="low-battery">Low Battery Alerts</Label>
              <Switch id="low-battery" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance-due">Maintenance Due</Label>
              <Switch id="maintenance-due" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="engine-diagnostics">Engine Diagnostics</Label>
              <Switch id="engine-diagnostics" />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Geofence & Security</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="geofence-violations">Geofence Violations</Label>
              <Switch id="geofence-violations" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="speeding-alerts">Speeding Alerts</Label>
              <Switch id="speeding-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="unauthorized-use">Unauthorized Use</Label>
              <Switch id="unauthorized-use" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="panic-button">Panic Button Alerts</Label>
              <Switch id="panic-button" defaultChecked />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">System Notifications</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="system-updates">System Updates</Label>
              <Switch id="system-updates" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="daily-reports">Daily Fleet Reports</Label>
              <Switch id="daily-reports" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="billing-alerts">Billing Alerts</Label>
              <Switch id="billing-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="api-status">API Status Updates</Label>
              <Switch id="api-status" />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Delivery Methods</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-notifications">SMS Notifications</Label>
              <Switch id="sms-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <Switch id="push-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="webhook-notifications">Webhook Notifications</Label>
              <Switch id="webhook-notifications" />
            </div>
          </div>
        </div>

        <Button>Save Notification Settings</Button>
      </CardContent>
    </Card>
  );
};

export default NotificationsSettingsTab;
