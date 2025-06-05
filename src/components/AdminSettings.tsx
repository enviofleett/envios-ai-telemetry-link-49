
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GP51CredentialsForm from './AdminSettings/GP51CredentialsForm';
import GP51ConnectionInfo from './AdminSettings/GP51ConnectionInfo';
import EnhancedMapApiManagement from './AdminSettings/EnhancedMapApiManagement';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('gp51');

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure system settings and integrations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gp51">GP51 Integration</TabsTrigger>
          <TabsTrigger value="map-api">Map API Management</TabsTrigger>
        </TabsList>

        <TabsContent value="gp51" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GP51 Connection Settings</CardTitle>
              <CardDescription>
                Configure your GP51 credentials to enable vehicle data synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GP51CredentialsForm />
            </CardContent>
          </Card>

          <GP51ConnectionInfo />
        </TabsContent>

        <TabsContent value="map-api">
          <EnhancedMapApiManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
