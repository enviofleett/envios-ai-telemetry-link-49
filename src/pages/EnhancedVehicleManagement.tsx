
import React from 'react';
import { Car } from 'lucide-react';
import EnhancedVehicleManagement from '@/components/vehicles/EnhancedVehicleManagement';

const EnhancedVehicleManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Car className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Enhanced Vehicle Management</h1>
          <p className="text-sm text-muted-foreground">
            Advanced vehicle tracking with real-time monitoring and system health checks
          </p>
        </div>
      </div>
      
      <EnhancedVehicleManagement />
    </div>
  );
};

export default EnhancedVehicleManagementPage;
