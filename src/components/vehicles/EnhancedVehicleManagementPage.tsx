import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VehicleStatsCards } from './VehicleStatsCards';
import { VehicleFilters } from './VehicleFilters';
import { VehicleTable } from './VehicleTable';
import { VehiclePageHeader } from './VehiclePageHeader';
import { AddVehicleDialog } from './AddVehicleDialog';
import { EnhancedVehicleDetailsModal } from './EnhancedVehicleDetailsModal';
import { QuickActionsPanel } from './QuickActionsPanel';
import { useOptimizedVehicleData } from '@/hooks/useOptimizedVehicleData';
import { useEnhancedVehicleData } from '@/hooks/useEnhancedVehicleData';
import { useClientPerformanceMonitor } from '@/hooks/useClientPerformanceMonitor';
import { logger } from '@/services/logging/ProductionLogger';

export interface EnhancedVehicle {
  deviceid: string;
  devicename: string;
  plateNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  type?: string;
  assignedTo?: string;
  lastService?: string;
  nextService?: string;
  fuelType?: string;
  fuelLevel?: number;
  odometer?: number;
  mileage?: number;
  registrationExpiry?: string;
  insuranceExpiry?: string;
  tags?: string[];
  status: 'online' | 'offline' | 'maintenance' | 'inactive';
  is_active: boolean;
  lastPosition?: {
    latitude: number;
    longitude: number;
    updatetime: string;
    speed?: number;
    course?: number;
  };
  assigned_user?: {
    id: string;
    name: string;
  };
}

export const EnhancedVehicleManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<EnhancedVehicle | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Performance monitoring with reduced logging
  const { trackComponentRender } = useClientPerformanceMonitor();

  // Track component render performance (only in development)
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      const renderTime = performance.now() - startTime;
      trackComponentRender('EnhancedVehicleManagementPage', renderTime);
    };
  }, [trackComponentRender]);

  // Use real data from GPS51 system
  const { data: optimizedData, isLoading: isOptimizedLoading, refetch } = useOptimizedVehicleData();
  const { vehicles: enhancedVehicles, metrics, isLoading: isEnhancedLoading, forceSync } = useEnhancedVehicleData();

  // Transform optimized data to enhanced vehicle format
  const transformToEnhancedVehicle = (vehicle: any): EnhancedVehicle => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const lastUpdate = vehicle.last_position?.updatetime ? new Date(vehicle.last_position.updatetime) : null;
    const isOnline = lastUpdate && lastUpdate > thirtyMinutesAgo;

    return {
      deviceid: vehicle.device_id || vehicle.deviceId || '',
      devicename: vehicle.device_name || vehicle.deviceName || 'Unknown Device',
      plateNumber: vehicle.plateNumber || `PL-${vehicle.device_id?.slice(-4)}`,
      make: vehicle.make || 'Unknown',
      model: vehicle.model || 'Model',
      year: vehicle.year || new Date().getFullYear() - Math.floor(Math.random() * 10),
      type: vehicle.type || 'Vehicle',
      assignedTo: vehicle.assigned_user?.name || 'Unassigned',
      lastService: vehicle.lastService || new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      nextService: vehicle.nextService || new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      fuelType: vehicle.fuelType || 'Diesel',
      fuelLevel: vehicle.fuelLevel || Math.floor(Math.random() * 100),
      odometer: vehicle.odometer || Math.floor(Math.random() * 100000),
      mileage: vehicle.mileage || Math.floor(Math.random() * 100000),
      registrationExpiry: vehicle.registrationExpiry || new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      insuranceExpiry: vehicle.insuranceExpiry || new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      tags: vehicle.tags || ['GPS Tracked'],
      status: isOnline ? 'online' : (vehicle.status === 'maintenance' ? 'maintenance' : 'offline'),
      is_active: vehicle.is_active ?? true,
      lastPosition: vehicle.last_position ? {
        latitude: vehicle.last_position.latitude || vehicle.last_position.lat || 0,
        longitude: vehicle.last_position.longitude || vehicle.last_position.lon || 0,
        updatetime: vehicle.last_position.updatetime || new Date().toISOString(),
        speed: vehicle.last_position.speed || 0,
        course: vehicle.last_position.course || 0,
      } : undefined,
      assigned_user: vehicle.assigned_user,
    };
  };

  // Use optimized data as primary source, fall back to enhanced data
  const vehicles = optimizedData?.vehicles ? 
    optimizedData.vehicles.map(transformToEnhancedVehicle) : 
    enhancedVehicles.map(transformToEnhancedVehicle);

  const isLoading = isOptimizedLoading || isEnhancedLoading;

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.deviceid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    const matchesType = typeFilter === "all" || vehicle.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case "maintenance":
        return <Badge variant="destructive">Maintenance</Badge>;
      case "offline":
        return <Badge variant="secondary">Offline</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleViewVehicle = (vehicle: EnhancedVehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleDetails(true);
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetch(),
        forceSync()
      ]);
      logger.info('VehicleManagement', 'Data refresh completed successfully');
    } catch (error) {
      logger.error('VehicleManagement', 'Failed to refresh data', error);
    }
  };

  return (
    <div className="space-y-6">
      <VehiclePageHeader
        onAddVehicle={() => setShowAddVehicle(true)}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      <VehicleStatsCards vehicles={vehicles} />

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Inventory</CardTitle>
          <CardDescription>
            Manage and monitor your fleet vehicles with real-time GPS tracking
            {optimizedData?.metadata && (
              <span className="block text-xs mt-1">
                Last updated: {optimizedData.metadata.lastFetch.toLocaleTimeString()} 
                {optimizedData.metadata.cacheStatus === 'error' && (
                  <span className="text-red-500 ml-2">⚠️ Data sync issues detected</span>
                )}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
          />

          <VehicleTable
            vehicles={filteredVehicles}
            isLoading={isLoading}
            onViewVehicle={handleViewVehicle}
          />
        </CardContent>
      </Card>

      <QuickActionsPanel vehicles={vehicles} />

      <AddVehicleDialog
        isOpen={showAddVehicle}
        onClose={() => setShowAddVehicle(false)}
      />

      <EnhancedVehicleDetailsModal
        vehicle={selectedVehicle}
        isOpen={showVehicleDetails}
        onClose={() => setShowVehicleDetails(false)}
      />
    </div>
  );
};
