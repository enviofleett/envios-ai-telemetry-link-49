import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import PackageManagementDashboard from '@/components/packages/PackageManagementDashboard';
const PackagesTab: React.FC = () => {
  return <TabsContent value="packages" className="space-y-4 mt-6">
      <div>
        
        
      </div>
      <PackageManagementDashboard />
    </TabsContent>;
};
export default PackagesTab;