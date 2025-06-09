
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminSettings from '@/components/admin/AdminSettings';

const AdminSettingsPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <AdminSettings />
      </Layout>
    </ProtectedRoute>
  );
};

export default AdminSettingsPage;
