
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Cog } from 'lucide-react';
import DeviceManagementTable from '@/components/devices/DeviceManagementTable';

const DeviceConfiguration: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Cog className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Device Configuration</h1>
              <p className="text-sm text-muted-foreground">
                Manage and configure fleet devices and equipment
              </p>
            </div>
          </div>
          
          <DeviceManagementTable />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default DeviceConfiguration;
