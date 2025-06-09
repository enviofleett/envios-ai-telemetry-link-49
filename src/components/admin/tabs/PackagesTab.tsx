import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import PackageManagementDashboard from '@/components/packages/PackageManagementDashboard';
const PackagesTab: React.FC = () => {
  return <TabsContent value="packages" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Subscriber Package Management</h3>
        
      </div>
      <PackageManagementDashboard />
    </TabsContent>;
};
export default PackagesTab;