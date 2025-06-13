
import React, { Suspense } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminSettings from '@/components/admin/AdminSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { StableErrorBoundary } from '@/components/StableErrorBoundary';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading settings...</p>
    </div>
  </div>
);

const PermissionDenied = ({ userRole, retryRoleCheck }: { userRole: string | null; retryRoleCheck: () => Promise<void> }) => (
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
);

const StableSettings: React.FC = () => {
  const { isAdmin, isCheckingRole, userRole, retryRoleCheck } = useAuth();

  console.log('🔍 StableSettings render - isAdmin:', isAdmin, 'isCheckingRole:', isCheckingRole, 'userRole:', userRole);

  return (
    <ProtectedRoute>
      <Layout>
        <StableErrorBoundary>
          <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
              <div className="text-xs text-muted-foreground">
                Role: {userRole || 'Loading...'}
              </div>
            </div>

            <Suspense fallback={<LoadingFallback />}>
              {isCheckingRole ? (
                <LoadingFallback />
              ) : isAdmin ? (
                <AdminSettings />
              ) : (
                <PermissionDenied userRole={userRole} retryRoleCheck={retryRoleCheck} />
              )}
            </Suspense>
          </div>
        </StableErrorBoundary>
      </Layout>
    </ProtectedRoute>
  );
};

export default StableSettings;
