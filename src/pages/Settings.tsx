
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminSettings from '@/components/admin/AdminSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const Settings: React.FC = () => {
  const { isAdmin, isCheckingRole, userRole, retryRoleCheck } = useAuth();

  console.log('🔍 Settings page render - isAdmin:', isAdmin, 'isCheckingRole:', isCheckingRole, 'userRole:', userRole);

  return (
    <ProtectedRoute>
      <Layout>
        {isCheckingRole ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Checking admin access permissions...
              </p>
            </div>
          </div>
        ) : isAdmin ? (
          <AdminSettings />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                Admin access required to view settings.
              </p>
              <p className="text-sm text-muted-foreground">
                Current role: {userRole || 'Unknown'}
              </p>
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
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default Settings;
