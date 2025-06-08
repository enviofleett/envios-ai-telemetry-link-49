
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { EnhancedMaintenancePage } from '@/components/maintenance/EnhancedMaintenancePage';

const Maintenance: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <EnhancedMaintenancePage />
      </Layout>
    </ProtectedRoute>
  );
};

export default Maintenance;
