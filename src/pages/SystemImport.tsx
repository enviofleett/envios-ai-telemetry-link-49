
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Database } from 'lucide-react';
import SystemImportManager from '@/components/admin/SystemImportManager';

const SystemImport: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">System Import</h1>
              <p className="text-sm text-muted-foreground">
                Import data from GP51 and manage system migrations
              </p>
            </div>
          </div>
          
          <SystemImportManager />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default SystemImport;
