
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { StableErrorBoundary } from '@/components/StableErrorBoundary';
import SettingsContent from '@/components/settings/SettingsContent';

const Settings: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <StableErrorBoundary>
          <SettingsContent />
        </StableErrorBoundary>
      </Layout>
    </ProtectedRoute>
  );
};

export default Settings;
