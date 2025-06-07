
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import MapAnalyticsDashboard from '@/components/map/MapAnalyticsDashboard';

const AnalyticsTab: React.FC = () => {
  return (
    <TabsContent value="analytics" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Map Usage Analytics</h3>
        <p className="text-sm text-gray-600 mb-4">
          Comprehensive analytics for map usage, performance metrics, and user behavior
        </p>
      </div>
      <MapAnalyticsDashboard />
    </TabsContent>
  );
};

export default AnalyticsTab;
