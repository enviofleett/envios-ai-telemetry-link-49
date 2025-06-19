
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Car, 
  Plus, 
  RefreshCw, 
  Search, 
  Filter,
  Download,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStableEnhancedVehicleData } from '@/hooks/useStableEnhancedVehicleData';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { VehicleManagementTable } from './VehicleManagementTable';
import { EnhancedVehicleCreationModal } from './EnhancedVehicleCreationModal';
import { VehicleEditModal } from './VehicleEditModal';
import { VehicleBulkOperations } from './VehicleBulkOperations';
import type { VehicleData } from '@/types/vehicle';

const EnhancedVehicleManagement: React.FC = () => {
  // Data hooks
  const { vehicles, isLoading, error, refetch, totalCount } = useStableEnhancedVehicleData();
  const { profiles: userProfiles, isLoading: usersLoading } = useUserProfiles();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleData[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleData | null>(null);

  // Transform user profiles for components that expect User interface
  const availableUsers = useMemo(() => {
    return userProfiles?.map(profile => ({
      id: profile.id,
      name: profile.full_name || 'Unknown User',
      email: profile.email || ''
    })) || [];
  }, [userProfiles]);

  // Filtered vehicles based on search and filters
  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    
    return vehicles.filter(vehicle => {
      const matchesSearch = !searchTerm || 
        vehicle.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.device_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
      
      const matchesUser = userFilter === 'all' || 
        (userFilter === 'unassigned' && !vehicle.user_id) ||
        vehicle.user_id === userFilter;
      
      return matchesSearch && matchesStatus && matchesUser;
    });
  }, [vehicles, searchTerm, statusFilter, userFilter]);

  // Vehicle stats
  const vehicleStats = useMemo(() => {
    if (!vehicles) return { total: 0, active: 0, inactive: 0, assigned: 0 };
    
    return {
      total: vehicles.length,
      active: vehicles.filter(v => v.status === 'active').length,
      inactive: vehicles.filter(v => v.status === 'inactive').length,
      assigned: vehicles.filter(v => v.user_id).length
    };
  }, [vehicles]);

  // Selection management
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedVehicles(filteredVehicles);
    } else {
      setSelectedVehicles([]);
    }
  };

  const handleSelectVehicle = (vehicle: VehicleData, checked: boolean) => {
    if (checked) {
      setSelectedVehicles(prev => [...prev, vehicle]);
    } else {
      setSelectedVehicles(prev => prev.filter(v => v.id !== vehicle.id));
    }
  };

  const getCheckboxState = () => {
    if (selectedVehicles.length === 0) return false;
    if (selectedVehicles.length === filteredVehicles.length) return true;
    return 'indeterminate';
  };

  // Event handlers
  const handleRefresh = () => {
    refetch();
    setSelectedVehicles([]);
  };

  const handleCreateVehicle = () => {
    setShowCreateModal(true);
  };

  const handleEditVehicle = (vehicle: VehicleData) => {
    setEditingVehicle(vehicle);
  };

  const handleVehicleCreated = () => {
    refetch();
    setShowCreateModal(false);
  };

  const handleVehicleUpdated = () => {
    refetch();
    setEditingVehicle(null);
  };

  const handleBulkOperationComplete = () => {
    refetch();
    setSelectedVehicles([]);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load vehicles: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enhanced Vehicle Management</h1>
          <p className="text-muted-foreground">
            Manage your fleet with advanced features and bulk operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateVehicle}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicleStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Fleet size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{vehicleStats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{vehicleStats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Not active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{vehicleStats.assigned}</div>
            <p className="text-xs text-muted-foreground">
              User assigned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={getCheckboxState()}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm">
                Select All ({selectedVehicles.length} selected)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Operations */}
      <VehicleBulkOperations
        selectedVehicles={selectedVehicles}
        onClearSelection={() => setSelectedVehicles([])}
        onOperationComplete={handleBulkOperationComplete}
        availableUsers={availableUsers}
      />

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Vehicles ({filteredVehicles.length})</span>
            {totalCount && (
              <Badge variant="secondary">
                Total: {totalCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
            </div>
          ) : (
            <VehicleManagementTable
              vehicles={filteredVehicles}
              selectedVehicles={selectedVehicles}
              onSelectVehicle={handleSelectVehicle}
              onEditVehicle={handleEditVehicle}
              availableUsers={availableUsers}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <EnhancedVehicleCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onVehicleCreated={handleVehicleCreated}
        availableUsers={availableUsers}
      />

      <VehicleEditModal
        vehicle={editingVehicle}
        isOpen={!!editingVehicle}
        onClose={() => setEditingVehicle(null)}
        onVehicleUpdated={handleVehicleUpdated}
        availableUsers={availableUsers}
      />
    </div>
  );
};

export default EnhancedVehicleManagement;
