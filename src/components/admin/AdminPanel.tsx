
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Database, Settings, Users, Bell } from 'lucide-react';
import SecurityTab from './tabs/SecurityTab';
import DataManagementTab from './tabs/DataManagementTab';
import SystemSettingsTab from './tabs/SystemSettingsTab';
import UserManagementTab from './tabs/UserManagementTab';
import NotificationsTab from './tabs/NotificationsTab';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('security');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Admin Panel
          </CardTitle>
          <CardDescription>
            System administration and configuration panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="security" className="space-y-4">
              <SecurityTab />
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <DataManagementTab />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <SystemSettingsTab />
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <UserManagementTab />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
