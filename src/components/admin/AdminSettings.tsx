import React, { useState } from 'react';
import AdminSettingsLayout from './AdminSettingsLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GP51ConnectionTest } from './GP51ConnectionTest';
import GP51Settings from './GP51Settings';
import UserManagement from './UserManagement';
import SystemSettings from './SystemSettings';
import AdminMonitoring from './AdminMonitoring';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('gp51');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Settings</h1>
      </div>

      <Tabs defaultValue="gp51" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gp51">GP51 Integration</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="gp51" className="space-y-6">
          <GP51ConnectionTest />
          <GP51Settings />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <AdminMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  );
}
