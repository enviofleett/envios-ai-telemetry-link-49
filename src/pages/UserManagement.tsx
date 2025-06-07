
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Users } from 'lucide-react';
import SimpleUserManagement from '@/components/admin/SimpleUserManagement';

const UserManagement: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage system users, roles, and permissions
              </p>
            </div>
          </div>
          
          <SimpleUserManagement />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default UserManagement;
