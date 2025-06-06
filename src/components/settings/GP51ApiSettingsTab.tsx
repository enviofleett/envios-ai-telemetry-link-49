
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const GP51ApiSettingsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          GPS51 API Configuration
          <Badge variant="outline" className="text-green-600 border-green-200">Connected</Badge>
        </CardTitle>
        <CardDescription>Configure GPS51 platform integration and data synchronization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gp51-endpoint">GP51 API Endpoint</Label>
            <Input id="gp51-endpoint" defaultValue="https://www.gps51.com/webapi" />
          </div>
          <div>
            <Label htmlFor="gp51-username">GP51 Username</Label>
            <Input id="gp51-username" defaultValue="fleetiq_admin" />
          </div>
        </div>

        <div>
          <Label htmlFor="gp51-password">GP51 Password</Label>
          <Input id="gp51-password" type="password" placeholder="Enter GP51 password" />
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Data Synchronization</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sync-interval">Sync Interval</Label>
              <Select defaultValue="30">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="retry-attempts">Retry Attempts</Label>
              <Select defaultValue="3">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 attempt</SelectItem>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="5">5 attempts</SelectItem>
                  <SelectItem value="10">10 attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Protocol Settings</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-device-discovery">Auto Device Discovery</Label>
              <Switch id="auto-device-discovery" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="real-time-tracking">Real-time Position Updates</Label>
              <Switch id="real-time-tracking" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="historical-data">Historical Data Import</Label>
              <Switch id="historical-data" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="device-commands">Enable Device Commands</Label>
              <Switch id="device-commands" defaultChecked />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Connection Status</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="last-sync">Last Successful Sync</Label>
              <Input id="last-sync" defaultValue="2025-06-06 14:30:25" readOnly />
            </div>
            <div>
              <Label htmlFor="active-devices">Active Devices</Label>
              <Input id="active-devices" defaultValue="23 / 25" readOnly />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button>Save GP51 Settings</Button>
          <Button variant="outline">Test Connection</Button>
          <Button variant="outline">Force Sync</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51ApiSettingsTab;
