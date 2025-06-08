
import React from 'react';
import Layout from '@/components/Layout';
import { WorkshopDashboard } from '@/components/admin/WorkshopDashboard';

const WorkshopManagement: React.FC = () => {
  return (
    <Layout>
      <WorkshopDashboard />
    </Layout>
  );
};

export default WorkshopManagement;
