
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Car } from 'lucide-react';
import EnhancedVehicleManagement from '@/components/vehicles/EnhancedVehicleManagement';

const VehicleManagement: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Car className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Vehicle Management</h1>
              <p className="text-sm text-muted-foreground">
                Monitor and manage your fleet vehicles with real-time tracking
              </p>
            </div>
          </div>
          
          <EnhancedVehicleManagement />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default VehicleManagement;
