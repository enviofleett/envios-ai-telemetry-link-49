
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import MultiProviderMapManagement from '@/components/AdminSettings/MultiProviderMapManagement';

const MapsTab: React.FC = () => {
  return (
    <TabsContent value="maps" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Multi-Provider Map Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure multiple map providers with intelligent failover, usage monitoring, and cost optimization
        </p>
      </div>
      <MultiProviderMapManagement />
    </TabsContent>
  );
};

export default MapsTab;
