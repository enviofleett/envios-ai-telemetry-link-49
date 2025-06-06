
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const FleetUserManagementTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet User Roles & Permissions</CardTitle>
        <CardDescription>Manage fleet operator roles and GPS51 user assignments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Fleet Administrator</h4>
              <p className="text-sm text-muted-foreground">Full access to all fleet operations</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Fleet Manager</h4>
              <p className="text-sm text-muted-foreground">Manage vehicles and drivers</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Dispatcher</h4>
              <p className="text-sm text-muted-foreground">Monitor live tracking and routes</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Reports Viewer</h4>
              <p className="text-sm text-muted-foreground">View analytics and reports only</p>
            </div>
            <Switch />
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h4 className="font-medium">Add New Fleet User</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="user-name">Full Name</Label>
              <Input id="user-name" placeholder="Enter full name" />
            </div>
            <div>
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" placeholder="Enter email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="user-role">Fleet Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fleet-admin">Fleet Administrator</SelectItem>
                  <SelectItem value="fleet-manager">Fleet Manager</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="reports-viewer">Reports Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gp51-access">GP51 Access Level</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select GP51 access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company-admin">Company Admin</SelectItem>
                  <SelectItem value="sub-admin">Sub Admin</SelectItem>
                  <SelectItem value="end-user">End User</SelectItem>
                  <SelectItem value="device-user">Device User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button>Add Fleet User</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FleetUserManagementTab;
