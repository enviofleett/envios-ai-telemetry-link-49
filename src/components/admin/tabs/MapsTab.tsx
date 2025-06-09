
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import EnhancedMapApiManagement from '@/components/AdminSettings/EnhancedMapApiManagement';

const MapsTab: React.FC = () => {
  return (
    <TabsContent value="maps" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Enhanced MapTiler API Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Advanced API key management with auto-switching, threshold monitoring, and performance analytics
        </p>
      </div>
      <EnhancedMapApiManagement />
    </TabsContent>
  );
};

export default MapsTab;
