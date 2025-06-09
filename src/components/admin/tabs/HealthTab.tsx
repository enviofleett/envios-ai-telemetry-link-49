
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import GP51HealthDashboard from '@/components/AdminSettings/GP51HealthDashboard';

const HealthTab: React.FC = () => {
  return (
    <TabsContent value="health" className="space-y-4 mt-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">GP51 Platform Health Monitoring</h3>
        <p className="text-sm text-gray-600 mb-4">
          Real-time monitoring of GP51 connection status, vehicle synchronization, and system health
        </p>
      </div>
      <GP51HealthDashboard />
    </TabsContent>
  );
};

export default HealthTab;
