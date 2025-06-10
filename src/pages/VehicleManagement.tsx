
import React from 'react';
import Layout from '@/components/Layout';
import EnhancedVehicleManagement from '@/components/vehicles/EnhancedVehicleManagement';

const VehicleManagement: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Management</h1>
        </div>
        <EnhancedVehicleManagement />
      </div>
    </Layout>
  );
};

export default VehicleManagement;
