
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Shield, Settings, Package, Database, Users, Zap } from 'lucide-react';
import UserManagementTab from '@/components/admin/tabs/UserManagementTab';
import GP51IntegrationTab from '@/components/admin/tabs/GP51IntegrationTab';
import SystemManagementTab from '@/components/settings/SystemManagementTab';
import PackageManagementTab from '@/components/settings/PackageManagementTab';

const AdminSettings: React.FC = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Admin Settings
          </CardTitle>
          <CardDescription>
            Manage system settings, users, and integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="gp51" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                GP51
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System
              </TabsTrigger>
              <TabsTrigger value="packages" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Packages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <UserManagementTab />
            </TabsContent>

            <TabsContent value="gp51" className="space-y-4">
              <GP51IntegrationTab />
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <SystemManagementTab />
            </TabsContent>

            <TabsContent value="packages" className="space-y-4">
              <PackageManagementTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
