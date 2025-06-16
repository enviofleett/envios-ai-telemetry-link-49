
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Cog } from 'lucide-react';
import DeviceManagementTable from '@/components/devices/DeviceManagementTable';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { useDeviceActivation } from '@/hooks/useDeviceActivation';
import { useAuth } from '@/contexts/AuthContext';

const DeviceConfiguration: React.FC = () => {
  const { devices, isLoading, error } = useDeviceManagement();
  const { bulkActivateDevices } = useDeviceActivation();
  const { user } = useAuth();

  const handleBulkActivate = async (deviceIds: string[]) => {
    if (!user?.id) return;
    
    try {
      await bulkActivateDevices(deviceIds, 1, user.id);
      // Refresh the devices list after activation
      window.location.reload();
    } catch (error) {
      console.error('Failed to activate devices:', error);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requireAdmin>
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading device configuration...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requireAdmin>
        <Layout>
          <div className="text-center py-8 text-red-600">
            Error: {error.message || "Failed to load device configuration"}
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

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
          
          <DeviceManagementTable 
            devices={devices || []}
            isLoading={isLoading}
            onBulkActivate={handleBulkActivate}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default DeviceConfiguration;
