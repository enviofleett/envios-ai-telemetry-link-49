
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GP51DeviceManagement from '@/components/fleet/GP51DeviceManagement';
import BillingDashboard from '@/components/billing/BillingDashboard';
import SubscriptionManagement from '@/components/billing/SubscriptionManagement';

const FleetManagement = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your devices, subscriptions, and billing in one place
        </p>
      </div>

      <Tabs defaultValue="devices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices">Device Management</TabsTrigger>
          <TabsTrigger value="billing">Billing Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-6">
          <GP51DeviceManagement />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingDashboard />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <SubscriptionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FleetManagement;
