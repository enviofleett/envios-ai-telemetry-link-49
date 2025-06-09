
import React from 'react';
import GP51HealthDashboard from '@/components/AdminSettings/GP51HealthDashboard';

const HealthTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">GP51 Platform Health Monitoring</h3>
        <p className="text-sm text-gray-600 mb-4">
          Real-time monitoring of GP51 connection status, vehicle synchronization, and system health
        </p>
      </div>
      <GP51HealthDashboard />
    </div>
  );
};

export default HealthTab;
