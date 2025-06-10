
import React from 'react';
import Layout from '@/components/Layout';
import FleetManagementDashboard from '@/components/dashboard/FleetManagementDashboard';

const FleetManagement: React.FC = () => {
  return (
    <Layout>
      <FleetManagementDashboard />
    </Layout>
  );
};

export default FleetManagement;
