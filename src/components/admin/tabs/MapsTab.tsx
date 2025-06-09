
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import GeocodingConfiguration from '@/components/admin/GeocodingConfiguration';

const MapsTab: React.FC = () => {
  return (
    <TabsContent value="maps" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Map & Geocoding Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure map providers and geocoding services for accurate address resolution
        </p>
      </div>
      
      <GeocodingConfiguration />
    </TabsContent>
  );
};

export default MapsTab;
