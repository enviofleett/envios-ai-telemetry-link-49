
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

const SystemImport: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">System Import</h1>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Data Import & Migration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                System import functionality will be implemented here.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default SystemImport;
