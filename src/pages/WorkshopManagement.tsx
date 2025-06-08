
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkshopDashboard from '@/components/admin/WorkshopDashboard';
import WorkshopRegistration from '@/components/admin/WorkshopRegistration';
import WorkshopConnection from '@/components/admin/WorkshopConnection';
import WorkshopActivation from '@/components/admin/WorkshopActivation';
import WorkshopMarketplace from '@/components/admin/WorkshopMarketplace';
import AdminMerchantManagement from '@/components/admin/AdminMerchantManagement';

const WorkshopManagement: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Workshop Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage workshop connections, registrations, and marketplace operations
              </p>
            </div>
          </div>
          
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="dashboard">Overview</TabsTrigger>
              <TabsTrigger value="registration">Registration</TabsTrigger>
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="activation">Activation</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="merchants">Merchants</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <WorkshopDashboard />
            </TabsContent>

            <TabsContent value="registration" className="mt-6">
              <WorkshopRegistration />
            </TabsContent>

            <TabsContent value="connection" className="mt-6">
              <WorkshopConnection />
            </TabsContent>

            <TabsContent value="activation" className="mt-6">
              <WorkshopActivation />
            </TabsContent>

            <TabsContent value="marketplace" className="mt-6">
              <WorkshopMarketplace />
            </TabsContent>

            <TabsContent value="merchants" className="mt-6">
              <AdminMerchantManagement />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default WorkshopManagement;
