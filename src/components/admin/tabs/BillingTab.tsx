
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import BillingSettingsTab from '@/components/settings/BillingSettingsTab';

const BillingTab: React.FC = () => {
  return (
    <TabsContent value="billing" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Billing & Subscription Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Manage your subscription, billing settings, and usage monitoring
        </p>
      </div>
      <BillingSettingsTab />
    </TabsContent>
  );
};

export default BillingTab;
