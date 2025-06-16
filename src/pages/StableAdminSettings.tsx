
import React, { Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminSettingsHub from '@/components/admin/AdminSettingsHub';
import { StableErrorBoundary } from '@/components/StableErrorBoundary';

const StableAdminSettingsFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading admin settings...</p>
    </div>
  </div>
);

const StableAdminSettings: React.FC = () => {
  return (
    <ProtectedRoute>
      <StableErrorBoundary>
        <Suspense fallback={<StableAdminSettingsFallback />}>
          <AdminSettingsHub />
        </Suspense>
      </StableErrorBoundary>
    </ProtectedRoute>
  );
};

export default StableAdminSettings;
