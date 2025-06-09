
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import EnhancedGeocodingConfiguration from '@/components/admin/EnhancedGeocodingConfiguration';

const MapsTab: React.FC = () => {
  return (
    <TabsContent value="maps" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Enhanced Map & Geocoding Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure map providers and geocoding services with database persistence and advanced monitoring
        </p>
      </div>
      
      <EnhancedGeocodingConfiguration />
    </TabsContent>
  );
};

export default MapsTab;
