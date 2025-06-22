
import React, { useState, useCallback, memo } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { StableErrorBoundary } from '@/components/StableErrorBoundary';
import { ProgressiveAdminLoader } from './ProgressiveAdminLoader';
import StableSettingsSidebar from './StableSettingsSidebar';
import AdminTabContentRenderer from './AdminTabContentRenderer';

const AdminSettingsContent = memo(() => {
  const [activeTab, setActiveTab] = useState('company');
  const { user, userRole } = useOptimizedAuth();

  // Memoize tab change handler to prevent unnecessary re-renders
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Admin Settings</h1>
        <div className="text-xs text-muted-foreground">
          Admin: {user?.email} | Role: {userRole}
        </div>
      </div>

      <div className="flex min-h-[600px] bg-white rounded-lg shadow-sm border">
        <StableSettingsSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
        <div className="flex-1 p-6">
          <AdminTabContentRenderer activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
});

AdminSettingsContent.displayName = 'AdminSettingsContent';

const AdminSettingsHub: React.FC = memo(() => {
  return (
    <StableErrorBoundary>
      <ProgressiveAdminLoader>
        <AdminSettingsContent />
      </ProgressiveAdminLoader>
    </StableErrorBoundary>
  );
});

AdminSettingsHub.displayName = 'AdminSettingsHub';

export default AdminSettingsHub;
