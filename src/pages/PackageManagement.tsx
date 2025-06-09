
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Package } from 'lucide-react';
import PackageManagementDashboard from '@/components/packages/PackageManagementDashboard';

const PackageManagement: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Package Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage subscriber packages, features, and permissions
              </p>
            </div>
          </div>
          
          <PackageManagementDashboard />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default PackageManagement;
