
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { EnhancedVehicleManagementPage } from '@/components/vehicles/EnhancedVehicleManagementPage';

const VehicleManagementPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <EnhancedVehicleManagementPage />
      </Layout>
    </ProtectedRoute>
  );
};

export default VehicleManagementPage;
