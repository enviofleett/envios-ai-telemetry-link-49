
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cog } from 'lucide-react';

const DeviceConfiguration: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Cog className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Device Configuration</h1>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Device Management & Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Device configuration functionality will be implemented here.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default DeviceConfiguration;
