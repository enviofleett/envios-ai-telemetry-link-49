
import React, { useState, useMemo } from 'react';
import { useEnhancedVehicleData } from '@/hooks/useEnhancedVehicleData';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Plus, Car, Users, AlertTriangle, Activity } from 'lucide-react';
import { VehicleManagementTable } from './VehicleManagementTable';
import { VehicleBulkOperations } from './VehicleBulkOperations';
import { VehicleEditModal } from './VehicleEditModal';
import { EnhancedVehicleCreationModal } from './EnhancedVehicleCreationModal';
import type { VehicleData } from '@/types/vehicle';

const EnhancedVehicleManagement: React.FC = () => {
  const { vehicles, metrics, isLoading, forceSync } = useEnhancedVehicleData();
  const { profiles, isLoading: isUsersLoading, error: usersError } = useUserProfiles();
  
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleData[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<VehicleData | null>(null);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);

  // Transform profiles to match expected user format
  const availableUsersOptions = useMemo(() => {
    return profiles.map(profile => ({
      id: profile.id,
      name: profile.full_name || `${profile.first_name} ${profile.last_name}`.trim() || 'Unknown User',
      email: profile.email || ''
    }));
  }, [profiles]);

  // Get data with proper error handling
  const data = useMemo(() => {
    return {
      vehicles,
      filteredVehicles: vehicles,
      statistics: {
        total: metrics.total,
        totalCount: metrics.total,
        active: metrics.online,
        online: metrics.online,
        alerts: metrics.alerts
      },
      isLoading,
      error: usersError ? new Error(usersError) : null,
      refetch: forceSync,
      setFilters: () => {},
      userOptions: availableUsersOptions
    };
  }, [vehicles, metrics, isLoading, usersError, forceSync, availableUsersOptions]);

  const handleSelectVehicle = (vehicle: VehicleData, checked: boolean) => {
    setSelectedVehicles(prev => 
      checked 
        ? [...prev, vehicle]
        : prev.filter(v => v.id !== vehicle.id)
    );
  };

  const handleEditVehicle = (vehicle: VehicleData) => {
    setEditingVehicle(vehicle);
  };

  const handleClearSelection = () => {
    setSelectedVehicles([]);
  };

  const handleOperationComplete = () => {
    forceSync();
    setSelectedVehicles([]);
  };

  const handleVehicleUpdated = () => {
    forceSync();
    setEditingVehicle(null);
  };

  const handleVehicleCreated = () => {
    forceSync();
    setIsCreationModalOpen(false);
  };

  if (isLoading || isUsersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading vehicle data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Vehicle Management</h1>
          <p className="text-muted-foreground">
            Comprehensive vehicle tracking and management system
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={forceSync} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsCreationModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {data.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading data: {data.error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.total}</div>
            <p className="text-xs text-muted-foreground">
              {data.statistics.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.statistics.online}</div>
            <p className="text-xs text-muted-foreground">
              Currently connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.statistics.alerts}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableUsersOptions.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Operations */}
      <VehicleBulkOperations
        selectedVehicles={selectedVehicles}
        onClearSelection={handleClearSelection}
        onOperationComplete={handleOperationComplete}
        availableUsers={availableUsersOptions}
      />

      {/* Vehicle Management Table */}
      <VehicleManagementTable
        vehicles={data.vehicles}
        selectedVehicles={selectedVehicles}
        onSelectVehicle={handleSelectVehicle}
        onEditVehicle={handleEditVehicle}
        availableUsers={availableUsersOptions}
      />

      {/* Edit Vehicle Modal */}
      <VehicleEditModal
        vehicle={editingVehicle}
        isOpen={!!editingVehicle}
        onClose={() => setEditingVehicle(null)}
        onVehicleUpdated={handleVehicleUpdated}
        availableUsers={availableUsersOptions}
      />

      {/* Vehicle Creation Modal */}
      <EnhancedVehicleCreationModal
        isOpen={isCreationModalOpen}
        onClose={() => setIsCreationModalOpen(false)}
        onVehicleCreated={handleVehicleCreated}
        availableUsers={availableUsersOptions}
      />
    </div>
  );
};

export default EnhancedVehicleManagement;
