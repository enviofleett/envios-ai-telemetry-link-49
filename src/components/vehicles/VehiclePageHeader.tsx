
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';

interface VehiclePageHeaderProps {
  onAddVehicle: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const VehiclePageHeader: React.FC<VehiclePageHeaderProps> = ({
  onAddVehicle,
  onRefresh,
  isLoading
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Vehicle Management</h2>
        <p className="text-muted-foreground">Manage and monitor your fleet vehicles with enhanced tracking</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button onClick={onAddVehicle}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>
    </div>
  );
};
