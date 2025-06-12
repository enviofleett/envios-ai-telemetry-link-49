
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { VehicleManagementTable } from '@/components/vehicles/VehicleManagementTable';
import { Car } from 'lucide-react';

const Vehicles: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Car className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Vehicle Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage vehicles, assign users, and view GP51 integration status
              </p>
            </div>
          </div>
          
          <VehicleManagementTable />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Vehicles;
