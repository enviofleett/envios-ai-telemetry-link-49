
import React, { useState, useCallback, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StableErrorBoundary } from '@/components/StableErrorBoundary';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import AdminSettingsLayout from './AdminSettingsLayout';

const AdminPermissionDenied = memo(({ userRole, retryRoleCheck }: { userRole: string | null; retryRoleCheck: () => Promise<void> }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center py-8 space-y-4">
      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
      <div>
        <h2 className="text-lg font-semibold mb-2">Admin Access Required</h2>
        <p className="text-muted-foreground mb-2">
          You need administrator privileges to access system settings.
        </p>
        <p className="text-sm text-muted-foreground">
          Current role: {userRole || 'Unknown'}
        </p>
      </div>
      <Button 
        onClick={retryRoleCheck}
        variant="outline"
        size="sm"
        className="mt-4"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry Access Check
      </Button>
    </div>
  </div>
));

AdminPermissionDenied.displayName = 'AdminPermissionDenied';

const AdminLoadingState = memo(() => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">
        Loading admin settings...
      </p>
    </div>
  </div>
));

AdminLoadingState.displayName = 'AdminLoadingState';

const AdminSettingsHub: React.FC = memo(() => {
  const [activeTab, setActiveTab] = useState('company');
  const { user, isAdmin, userRole, isCheckingRole, retryRoleCheck } = useAuth();

  // Memoize tab change handler to prevent unnecessary re-renders
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Show loading state if still checking role
  if (isCheckingRole) {
    return <AdminLoadingState />;
  }

  // Show permission denied if not admin
  if (!isAdmin) {
    return <AdminPermissionDenied userRole={userRole} retryRoleCheck={retryRoleCheck} />;
  }

  return (
    <StableErrorBoundary>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Settings</h1>
          <div className="text-xs text-muted-foreground">
            Admin: {user?.email} | Role: {userRole}
          </div>
        </div>

        <AdminSettingsLayout 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
      </div>
    </StableErrorBoundary>
  );
});

AdminSettingsHub.displayName = 'AdminSettingsHub';

export default AdminSettingsHub;
