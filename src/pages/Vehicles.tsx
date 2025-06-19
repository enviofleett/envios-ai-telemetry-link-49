
import React, { useState, useCallback, useMemo } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { VehicleManagementTable } from '@/components/vehicles/VehicleManagementTable';
import { Car } from 'lucide-react';
import { useStableEnhancedVehicleData } from '@/hooks/useStableEnhancedVehicleData';
import type { VehicleData } from '@/types/vehicle';

const Vehicles: React.FC = () => {
  // Fetch vehicle data and user options
  const {
    vehicles,
    filteredVehicles,
    isLoading,
    error,
    userOptions,
  } = useStableEnhancedVehicleData();

  // Manage selected vehicles state
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleData[]>([]);

  // Handle vehicle selection
  const handleSelectVehicle = useCallback((vehicle: VehicleData, checked: boolean) => {
    setSelectedVehicles(prev => {
      if (checked) {
        return [...prev, vehicle];
      } else {
        return prev.filter(v => v.id !== vehicle.id);
      }
    });
  }, []);

  // Handle vehicle editing
  const handleEditVehicle = useCallback((vehicle: VehicleData) => {
    console.log('Edit vehicle:', vehicle.device_name);
    // TODO: Implement edit functionality
  }, []);

  // Transform user options to match expected format
  const availableUsers = useMemo(() => {
    return userOptions.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email || ''
    }));
  }, [userOptions]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Loading vehicles...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-red-600">
              <p>Error loading vehicles: {error.message}</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

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
          
          <VehicleManagementTable
            vehicles={filteredVehicles}
            selectedVehicles={selectedVehicles}
            onSelectVehicle={handleSelectVehicle}
            onEditVehicle={handleEditVehicle}
            availableUsers={availableUsers}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Vehicles;
