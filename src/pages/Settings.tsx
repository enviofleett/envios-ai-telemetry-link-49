
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminSettings from '@/components/AdminSettings';
import { useAuth } from '@/contexts/AuthContext';

const Settings: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          
          {isAdmin ? (
            <AdminSettings />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Admin access required to view settings.
              </p>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Settings;
