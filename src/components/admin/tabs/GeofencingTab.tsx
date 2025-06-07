
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import GeofenceManager from '@/components/map/GeofenceManager';

const GeofencingTab: React.FC = () => {
  return (
    <TabsContent value="geofencing" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Geofencing Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Create and manage geographical boundaries with real-time vehicle monitoring
        </p>
      </div>
      <GeofenceManager />
    </TabsContent>
  );
};

export default GeofencingTab;
