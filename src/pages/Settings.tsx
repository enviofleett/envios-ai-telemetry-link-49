
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminSettings from '@/components/admin/AdminSettings';
import { useAuth } from '@/contexts/AuthContext';

const Settings: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <ProtectedRoute>
      <Layout>
        {isAdmin ? (
          <AdminSettings />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Admin access required to view settings.
              </p>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default Settings;
