
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Database, RefreshCw, Smartphone, BarChart3 } from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Navigate } from 'react-router-dom';
import GP51SyncTab from '@/components/admin/tabs/GP51SyncTab';
import UsersTab from '@/components/admin/tabs/UsersTab';
import UserManagementTab from '@/components/admin/tabs/UserManagementTab';
import MobileAppTab from '@/components/admin/tabs/MobileAppTab';

const AdminDashboard: React.FC = () => {
  const { user, loading } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState('gp51sync');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Welcome, {user.user_metadata?.name || user.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">System Administration</h2>
          <p className="text-gray-600 mt-2">Manage GP51 integration, users, and mobile app deployment</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gp51sync" className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>GP51 Sync</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </TabsTrigger>
            <TabsTrigger value="mobileapp" className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4" />
              <span>Mobile App</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gp51sync" className="mt-6">
            <GP51SyncTab />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UsersTab />
          </TabsContent>

          <TabsContent value="mobileapp" className="mt-6">
            <MobileAppTab />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
                <CardDescription>
                  Performance metrics and usage statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Analytics dashboard coming soon with sync performance, user activity, and system health metrics.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
